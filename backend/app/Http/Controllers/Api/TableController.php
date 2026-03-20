<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use App\Traits\HasFcm;

class TableController extends Controller
{
    use HasFcm;
    public function index(Request $request)
    {
        $query = RestaurantTable::with(['floor', 'mergedTables', 'mergedWith']);
        if ($request->has('floor_id')) {
            $query->where('floor_id', $request->floor_id);
        }
        if ($request->has('waiter_id')) {
            $query->where('assigned_waiter_id', $request->waiter_id);
        }
        return $query->orderBy('order_index')->orderBy('table_number')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'floor_id' => 'required|exists:floors,id',
            'table_number' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'shape' => 'required|in:square,round',
            'status' => 'required|in:available,occupied,reserved,cleaning',
            'order_index' => 'integer|min:0',
        ]);

        if (isset($validated['order_index'])) {
            $this->shiftIndices($validated['floor_id'], $validated['order_index']);
        }

        $table = RestaurantTable::create($validated);
        return response()->json($table, 201);
    }

    public function update(Request $request, RestaurantTable $table)
    {
        $validated = $request->validate([
            'floor_id' => 'sometimes|required|exists:floors,id',
            'table_number' => 'sometimes|required|string|max:255',
            'capacity' => 'sometimes|required|integer|min:1',
            'shape' => 'sometimes|required|in:square,round',
            'status' => 'sometimes|required|in:available,occupied,reserved,cleaning',
            'merged_with_id' => 'nullable|exists:tables,id',
            'is_merged' => 'boolean',
            'order_index' => 'sometimes|integer|min:0',
        ]);

        if (isset($validated['order_index']) && $validated['order_index'] != $table->order_index) {
            $this->shiftIndices($validated['floor_id'] ?? $table->floor_id, $validated['order_index'], $table->id);
        }

        $table->update($validated);
        return $table;
    }

    private function shiftIndices($floorId, $targetIndex, $excludeId = null)
    {
        $existing = RestaurantTable::where('floor_id', $floorId)
            ->where('order_index', $targetIndex)
            ->when($excludeId, function($query) use ($excludeId) {
                return $query->where('id', '!=', $excludeId);
            })
            ->first();

        if ($existing) {
            // Shift current and all subsequent tables using mass update for efficiency
            RestaurantTable::where('floor_id', $floorId)
                ->where('order_index', '>=', $targetIndex)
                ->when($excludeId, function($query) use ($excludeId) {
                    return $query->where('id', '!=', $excludeId);
                })
                ->increment('order_index');
        }
    }

    public function merge(Request $request)
    {
        $request->validate([
            'parent_id' => 'required|exists:tables,id',
            'table_ids' => 'required|array',
            'table_ids.*' => 'exists:tables,id',
        ]);

        $parent = RestaurantTable::findOrFail($request->parent_id);
        
        RestaurantTable::whereIn('id', $request->table_ids)
            ->where('id', '!=', $parent->id)
            ->update([
                'merged_with_id' => $parent->id,
                'status' => 'occupied' // Usually merging happens when they are occupied or about to be
            ]);

        $parent->update(['is_merged' => true, 'status' => 'occupied']);

        return response()->json(['message' => 'Tables merged successfully', 'parent' => $parent->load('mergedTables')]);
    }

    public function split(Request $request)
    {
        $request->validate([
            'parent_id' => 'required|exists:tables,id',
        ]);

        $parent = RestaurantTable::findOrFail($request->parent_id);
        
        RestaurantTable::where('merged_with_id', $parent->id)
            ->update(['merged_with_id' => null, 'status' => 'available']);

        $parent->update(['is_merged' => false, 'status' => 'available']);

        return response()->json(['message' => 'Tables split successfully']);
    }

    public function show(RestaurantTable $table)
    {
        return $table->load(['floor', 'mergedTables', 'mergedWith']);
    }

    public function destroy(RestaurantTable $table)
    {
        $table->delete();
        return response()->json(null, 204);
    }

    public function assignWaiter(Request $request, RestaurantTable $table)
    {
        $validated = $request->validate([
            'waiter_id' => 'nullable|exists:users,id'
        ]);

        $table->update([
            'assigned_waiter_id' => $validated['waiter_id']
        ]);

        if ($validated['waiter_id']) {
            $waiter = \App\Models\User::find($validated['waiter_id']);
            if ($waiter) {
                $this->sendFcmNotification(
                    $waiter,
                    '📋 New Table Assigned',
                    "You have been assigned to Table " . $table->table_number . " (" . $table->floor?->name . ").",
                    ['table_id' => (string)$table->id, 'type' => 'table_assigned']
                );
            }
        }

        return response()->json([
            'message' => 'Waiter assigned successfully',
            'table' => $table->load('assignedWaiter')
        ]);
    }

    public function requestBillForTable(Request $request, RestaurantTable $table)
    {
        // Find all active orders for this table
        $orders = \App\Models\Order::where('table_id', $table->id)
            ->whereIn('status', ['Pending', 'Preparing', 'Ready', 'Served'])
            ->get();

        if ($orders->isEmpty()) {
            return response()->json([
                'message' => 'No active orders found for this table.'
            ], 404);
        }

        // Mark them all as bill requested
        foreach ($orders as $order) {
            $order->update(['is_bill_requested' => true]);
        }

        // Notify Admin of Bill Request
        $adminUsers = \App\Models\User::where('tenant_id', $table->floor->tenant_id)
            ->where('role', 'admin')
            ->whereNotNull('fcm_token')
            ->get();

        foreach ($adminUsers as $admin) {
            $this->sendFcmNotification(
                $admin,
                '💳 Bill Requested',
                "Table {$table->table_number} is requesting the bill.",
                [
                    'table_id' => (string)$table->id,
                    'table_number' => $table->table_number,
                    'type' => 'bill_requested'
                ]
            );
        }

        return response()->json([
            'message' => 'Bill requested successfully',
            'orders' => $orders
        ]);
    }

    public function markCleaned(Request $request, RestaurantTable $table)
    {
        $table->update(['status' => 'available']);
        return response()->json(['message' => 'Table marked as available', 'table' => $table]);
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'table_ids' => 'required|array',
            'table_ids.*' => 'exists:tables,id',
        ]);

        foreach ($request->table_ids as $index => $id) {
            RestaurantTable::where('id', $id)->update(['order_index' => $index]);
        }

        return response()->json(['message' => 'Tables reordered successfully']);
    }
}
