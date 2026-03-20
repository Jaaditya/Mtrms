<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\RestaurantTable;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GuestMenuController extends Controller
{
    public function show($tenantSlug, $tableId)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->firstOrFail();
        
        // Find the scanned table
        $scannedTable = RestaurantTable::where('id', $tableId)
            ->whereHas('floor', function($query) use ($tenant) {
                $query->where('tenant_id', $tenant->id);
            })
            ->firstOrFail();
            
        // Resolve the effective table (parent if merged)
        $table = $scannedTable->getEffectiveTable();

        // Automatically reserve/occupy the table when scanned
        if ($table->status === 'available') {
            $table->update(['status' => 'occupied']);
        }
        
        // Scope queries to this tenant
        session(['tenant_id' => $tenant->id]);
        
        $categories = Category::with(['menuItems' => function($q) {
            $q->where('is_available', true);
        }])
        ->where('is_active', true)
        ->orderBy('order_index')
        ->get();

        // Fetch active order for the effective table
        $activeOrder = $table->activeOrder();

        return view('guest.menu', [
            'tenant' => $tenant,
            'table' => $scannedTable, // Pass scanned table for UI
            'effectiveTable' => $table, // Pass effective table for logic
            'categories' => $categories,
            'activeOrder' => $activeOrder
        ]);
    }

    public function storeOrder(Request $request, $tenantSlug, $tableId)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->firstOrFail();
        $table = RestaurantTable::findOrFail($tableId);
        $items = $request->input('items', []);

        if (empty($items)) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        return DB::transaction(function () use ($tenant, $table, $items) {
            $newSubtotal = 0;
            foreach ($items as $item) {
                $newSubtotal += $item['price'] * $item['quantity'];
            }

            // Always use the effective table for orders
            $effectiveTable = $table->getEffectiveTable();

            // Check if there is an existing active order on the effective table
            $order = $effectiveTable->activeOrder();

            if ($order) {
                // Update existing order
                $order->subtotal += $newSubtotal;
                $order->tax = $order->subtotal * 0.13;
                $order->total = $order->subtotal + $order->tax;
                $order->save();
                
                $message = 'Items added to your existing order!';
            } else {
                // Create new order
                $tax = $newSubtotal * 0.13;
                $total = $newSubtotal + $tax;

                $order = Order::create([
                    'tenant_id' => $tenant->id,
                    'table_id' => $effectiveTable->id,
                    'type' => 'dine-in',
                    'status' => 'Pending',
                    'subtotal' => $newSubtotal,
                    'tax' => $tax,
                    'total' => $total,
                ]);
                
                $message = 'Order placed successfully!';
            }

            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'status' => 'Pending',
                ]);
            }

            $table->update(['status' => 'occupied']);

            return response()->json([
                'message' => $message,
                'order_id' => $order->id
            ]);
        });
    }

    public function callWaiter($tenantSlug, $tableId)
    {
        $table = RestaurantTable::findOrFail($tableId);
        $effectiveTable = $table->getEffectiveTable();
        $effectiveTable->update(['status' => 'occupied']);
        // Here you could add a notification to the staff
        return response()->json(['message' => 'Waiter called! Someone will be with you shortly.']);
    }

    public function requestBill($tenantSlug, $tableId)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->firstOrFail();
        $scannedTable = RestaurantTable::findOrFail($tableId);
        $effectiveTable = $scannedTable->getEffectiveTable();

        $activeOrder = Order::where('table_id', $effectiveTable->id)
            ->where('tenant_id', $tenant->id)
            ->whereIn('status', ['Pending', 'Preparing', 'Ready', 'Served'])
            ->latest()
            ->first();

        if ($activeOrder) {
            $activeOrder->update(['is_bill_requested' => true]);
            return response()->json(['message' => 'Bill request sent! Staff will be with you shortly.']);
        }

        return response()->json(['message' => 'No active order found to bill.'], 404);
    }

    public function showBill($tenantSlug, $tableId)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->firstOrFail();
        $scannedTable = RestaurantTable::findOrFail($tableId);
        $table = $scannedTable->getEffectiveTable();

        $activeOrder = Order::with('items.menuItem')
            ->where('table_id', $table->id)
            ->where('tenant_id', $tenant->id)
            ->whereIn('status', ['Pending', 'Preparing', 'Completed'])
            ->latest()
            ->first();

        return view('guest.bill', [
            'tenant' => $tenant,
            'table' => $scannedTable,
            'effectiveTable' => $table,
            'activeOrder' => $activeOrder
        ]);
    }
}
