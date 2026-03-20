<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function store(Request $request, Order $order)
    {
        $validated = $request->validate([
            'method' => 'required|in:Cash,Card,Digital Wallet',
            'amount' => 'required|numeric|min:0',
            'transaction_id' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $order) {
            // Record the payment
            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $validated['amount'],
                'method' => $validated['method'],
                'status' => 'Completed',
                'transaction_id' => $validated['transaction_id'] ?? null,
            ]);

            // Complete the order
            $order->update([
                'status' => 'Completed',
                'is_bill_requested' => false,
            ]);

            // Release the table if one is associated
            if ($order->table_id) {
                // Find effective table
                $table = \App\Models\RestaurantTable::find($order->table_id);
                if ($table) {
                    $effectiveTable = $table->getEffectiveTable();
                    $effectiveTable->update([
                        'status' => 'available',
                        'assigned_waiter_id' => null
                    ]);
                }
            }

            return response()->json($payment, 201);
        });
    }

    public function settleTable(Request $request, \App\Models\RestaurantTable $table)
    {
        $validated = $request->validate([
            'method' => 'required|in:Cash,Card,Digital Wallet',
            'transaction_id' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $table) {
            // Find all active orders for this table
            $orders = Order::where('table_id', $table->id)
                ->whereIn('status', ['Pending', 'Preparing', 'Ready', 'Served'])
                ->get();

            if ($orders->isEmpty()) {
                return response()->json(['message' => 'No active orders for this table'], 404);
            }

            $totalAmount = $orders->sum('total');

            // Create a single payment record for the unified amount
            $payment = Payment::create([
                'amount' => $totalAmount,
                'method' => $validated['method'],
                'status' => 'Completed',
                'transaction_id' => $validated['transaction_id'] ?? null,
                // We'll associate it with the first order for record keeping, 
                // or we might need a better way to link multiple orders to one payment
                'order_id' => $orders->first()->id, 
            ]);

            // Complete all orders
            foreach ($orders as $order) {
                $order->update([
                    'status' => 'Completed',
                    'is_bill_requested' => false,
                ]);
            }

            // Move table to cleaning status
            $effectiveTable = $table->getEffectiveTable();
            $effectiveTable->update([
                'status' => 'cleaning',
                'assigned_waiter_id' => null
            ]);

            return response()->json([
                'message' => 'Table settled successfully',
                'payment' => $payment,
                'total_settled' => $totalAmount,
                'orders_completed' => $orders->count()
            ], 201);
        });
    }
}
