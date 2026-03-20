<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderItemController extends Controller
{
    public function updateStatus(Request $request, OrderItem $orderItem)
    {
        $validated = $request->validate([
            'status' => 'required|in:Pending,Preparing,Ready,Served,Cancelled',
        ]);

        $orderItem->update(['status' => $validated['status']]);

        // Automatically update parent order status based on item statuses
        $order = $orderItem->order;
        $items = $order->items;
        
        $allReady = true;
        $anyPreparing = false;
        
        foreach ($items as $item) {
            if ($item->status !== 'Ready' && $item->status !== 'Served' && $item->status !== 'Cancelled') {
                $allReady = false;
            }
            if ($item->status === 'Preparing') {
                $anyPreparing = true;
            }
        }

        if ($allReady) {
            $order->update(['status' => 'Ready']);
        } elseif ($anyPreparing && $order->status === 'Pending') {
            $order->update(['status' => 'Preparing']);
        }

        return $orderItem->load('menuItem');
    }
}
