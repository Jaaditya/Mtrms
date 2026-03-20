<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Google\Auth\Credentials\ServiceAccountCredentials;
use App\Traits\HasFcm;

class OrderController extends Controller
{
    use HasFcm;
    public function index(Request $request)
    {
        $query = Order::with(['table.floor', 'staff', 'items.menuItem', 'payments', 'tenant']);

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $statuses = explode(',', $request->status);
            $query->whereIn('status', $statuses);
        }

        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        if ($request->has('waiter_id') && $request->waiter_id) {
            $query->where(function($q) use ($request) {
                $q->whereHas('table', function($t) use ($request) {
                    $t->where('assigned_waiter_id', $request->waiter_id);
                })->orWhere('user_id', $request->waiter_id);
            });
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhereHas('table', function($t) use ($search) {
                      $t->where('table_number', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'type' => 'required|in:Dine-in,Takeaway,Delivery',
            'status' => 'required|in:Pending,Preparing,Ready,Served,Completed,Cancelled',
            'promo_code' => 'nullable|string|exists:promo_codes,code',
            'items' => 'required|array',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric',
            'items.*.instructions' => 'nullable|string',
        ]);

        $tableId = $validated['table_id'];
        if ($tableId) {
            $table = \App\Models\RestaurantTable::find($tableId);
            if ($table) {
                $effectiveTable = $table->getEffectiveTable();
                $tableId = $effectiveTable->id;
                
                $effectiveTable->update([
                    'status' => 'occupied',
                    'assigned_waiter_id' => auth()->id()
                ]);
            }
        }

        $tenantId = auth()->user()->tenant_id;
        $tenant = \App\Models\Tenant::find($tenantId);

        $subtotal = 0;
        $scAmount = 0;
        $taxableAmount = 0;

        // Fetch all menu items
        $menuItemIds = collect($validated['items'])->pluck('menu_item_id');
        $menuItems = \App\Models\MenuItem::whereIn('id', $menuItemIds)->get()->keyBy('id');

        foreach ($validated['items'] as $item) {
            $menuItem = $menuItems[$item['menu_item_id']];
            $itemBase = $item['unit_price'] * $item['quantity'];
            $subtotal += $itemBase;

            if ($tenant->is_service_charge_enabled && $menuItem->is_service_chargeable) {
                $scAmount += ($itemBase * $tenant->service_charge_rate) / 100;
            }
        }

        // Calculate Discount from Promo Code
        $discountAmount = 0;
        $appliedPromo = null;
        if (!empty($validated['promo_code'])) {
            $promo = \App\Models\PromoCode::where('code', $validated['promo_code'])
                ->where('is_active', true)
                ->where(function($q) {
                    $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', now()->toDateString());
                })
                ->first();

            if ($promo) {
                $appliedPromo = $promo->code;
                if ($promo->type === 'percentage') {
                    $discountAmount = ($subtotal * $promo->discount_value) / 100;
                } else {
                    $discountAmount = $promo->discount_value;
                }
            }
        }

        // Apply Automated Discount Rules (Bill Level)
        $activeRules = \App\Models\DiscountRule::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->where('type', 'Bill Level')
            ->get();
        
        $ruleDiscount = 0;
        foreach ($activeRules as $rule) {
            // For now, simple highest-value logic
            $currentRuleDiscount = ($subtotal * $rule->value) / 100;
            if ($currentRuleDiscount > $ruleDiscount) {
                $ruleDiscount = $currentRuleDiscount;
            }
        }
        
        $totalDiscount = $discountAmount + $ruleDiscount;

        // Amount subject to tax (usually subtotal - discount + service charge)
        $netAmount = $subtotal - $totalDiscount + $scAmount;
        
        $taxAmount = 0;
        $finalTotal = 0;

        if ($tenant->tax_type === 'exclusive') {
            $taxAmount = ($netAmount * $tenant->vat_rate) / 100;
            $finalTotal = $netAmount + $taxAmount;
        } else {
            // Inclusive tax: Tax is already inside the netAmount
            $taxAmount = $netAmount - ($netAmount / (1 + ($tenant->vat_rate / 100)));
            $finalTotal = $netAmount;
        }

        $orderData = [
            'tenant_id' => $tenantId,
            'user_id' => auth()->id(),
            'table_id' => $tableId,
            'type' => $validated['type'],
            'status' => $validated['status'],
            'promo_code' => $appliedPromo,
            'subtotal' => $subtotal,
            'discount' => $totalDiscount,
            'service_charge' => $scAmount,
            'tax' => $taxAmount,
            'total' => $finalTotal,
        ];

        $order = Order::create($orderData);
        
        foreach ($validated['items'] as $item) {
            $order->items()->create($item);
        }

        // Send FCM notifications to Admin and Kitchen staff
        $this->notifyStaffOfNewOrder($order);

        return response()->json($order->load(['items.menuItem', 'tenant']), 201);
    }

    private function notifyStaffOfNewOrder($order)
    {
        $users = \App\Models\User::where('tenant_id', $order->tenant_id)
            ->whereIn('role', ['admin', 'kitchen'])
            ->whereNotNull('fcm_token')
            ->get();

        foreach ($users as $user) {
            $this->sendFcmNotification(
                $user, 
                '🍳 New Order #' . $order->id, 
                'Table ' . ($order->table?->table_number ?? 'N/A') . ' — New order needs preparation!',
                ['order_id' => (string)$order->id, 'type' => 'new_order']
            );
        }
    }

    public function show(Order $order)
    {
        return $order->load(['table', 'staff', 'items.menuItem', 'payments', 'tenant']);
    }

    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'sometimes|required|in:Pending,Preparing,Ready,Served,Completed,Cancelled',
            'table_id' => 'nullable|exists:tables,id',
            'type' => 'sometimes|required|in:Dine-in,Takeaway,Delivery',
            'total' => 'sometimes|required|numeric',
        ]);

        $oldStatus = $order->status;
        $order->update($validated);

        if (isset($validated['status']) && $validated['status'] === 'Served') {
            $order->items()->update(['status' => 'Served']);
        }

        // Notify waiter if food is READY
        if (isset($validated['status']) && $validated['status'] === 'Ready' && $oldStatus !== 'Ready') {
            $waiter = $order->table?->assignedWaiter;
            if ($waiter) {
                $this->sendFcmNotification(
                    $waiter,
                    '🛎️ Order Ready!',
                    "Order #{$order->id} for Table " . ($order->table?->table_number ?? 'N/A') . " is ready to be served.",
                    ['order_id' => (string)$order->id, 'type' => 'order_ready']
                );
            }
        }

        return $order->load(['items.menuItem', 'table.assignedWaiter']);
    }

    public function getTodayServiced(Request $request, $waiterId)
    {
        return Order::with(['table.floor', 'items.menuItem', 'tenant'])
            ->where(function($q) use ($waiterId) {
                $q->whereHas('table', function($t) use ($waiterId) {
                    $t->where('assigned_waiter_id', $waiterId);
                })->orWhere('user_id', $waiterId);
            })
            ->whereIn('status', ['Served', 'Completed'])
            ->whereDate('updated_at', now()->toDateString())
            ->latest()
            ->get();
    }

    public function destroy(Order $order)
    {
        $order->delete();
        return response()->json(null, 204);
    }
}
