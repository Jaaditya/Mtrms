<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\RestaurantTable;
use App\Models\MenuItem;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first();
        if (!$tenant) return;

        // Clean up old mock orders to ensure all follow new tax rules
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Order::truncate();
        OrderItem::truncate();
        Payment::truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $table = RestaurantTable::whereHas('floor', function($q) use ($tenant) {
            $q->where('tenant_id', $tenant->id);
        })->first();
        
        if (!$table) return;

        $user = User::where('tenant_id', $tenant->id)->first() ?? User::first();
        $menuItems = MenuItem::whereHas('category', function($q) use ($tenant) {
            $q->where('tenant_id', $tenant->id);
        })->take(5)->get();

        if ($menuItems->isEmpty()) return;

        // Create a few mock orders
        for ($i = 0; $i < 5; $i++) {
            $type = ['Dine-in', 'Takeaway', 'Delivery'][rand(0, 2)];
            $status = ['Pending', 'Preparing', 'Ready', 'Served', 'Completed'][rand(0, 4)];
            
            $order = Order::create([
                'tenant_id' => $tenant->id,
                'table_id' => $type === 'Dine-in' ? $table->id : null,
                'user_id' => $user->id,
                'type' => $type,
                'status' => $status,
                'subtotal' => 0,
                'discount' => 0,
                'service_charge' => 0,
                'tax' => 0,
                'total' => 0,
            ]);

            $subtotal = 0;
            $serviceCharge = 0;
            $taxableAmount = 0;

            foreach ($menuItems->random(rand(1, 3)) as $item) {
                $qty = rand(1, 4);
                $price = $item->price;
                $lineTotal = $qty * $price;
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $item->id,
                    'quantity' => $qty,
                    'unit_price' => $price,
                ]);
                $subtotal += $lineTotal;

                $itemSC = 0;
                if ($tenant->is_service_charge_enabled && ($item->is_service_chargeable ?? true)) {
                    $itemSC = ($lineTotal * $tenant->service_charge_rate) / 100;
                    $serviceCharge += $itemSC;
                }

                if ($item->is_taxable ?? true) {
                    $taxableAmount += ($lineTotal + $itemSC);
                }
            }

            $tax = 0;
            if ($tenant->tax_type === 'exclusive') {
                $tax = ($taxableAmount * $tenant->vat_rate) / 100;
            } else {
                $tax = $taxableAmount - ($taxableAmount / (1 + ($tenant->vat_rate / 100)));
            }

            $finalTotal = ($tenant->tax_type === 'exclusive') ? ($subtotal + $serviceCharge + $tax) : ($subtotal + $serviceCharge);

            $order->update([
                'subtotal' => $subtotal,
                'service_charge' => $serviceCharge,
                'tax' => $tax,
                'total' => $finalTotal,
            ]);

            if ($status === 'Completed') {
                Payment::create([
                    'order_id' => $order->id,
                    'amount' => $finalTotal,
                    'method' => ['Cash', 'Card', 'Online'][rand(0, 2)],
                    'status' => 'Paid',
                ]);
            }
        }
    }
}
