<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantTable extends Model
{
    protected $table = 'tables';

    protected $fillable = ['floor_id', 'table_number', 'capacity', 'shape', 'status', 'merged_with_id', 'is_merged', 'assigned_waiter_id', 'order_index'];

    public function floor(): BelongsTo
    {
        return $this->belongsTo(Floor::class);
    }

    public function assignedWaiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_waiter_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }

    public function activeOrder()
    {
        $tableId = $this->effectiveTableId();
        return Order::where('table_id', $tableId)
            ->whereIn('status', ['Pending', 'Preparing'])
            ->latest()
            ->first();
    }

    public function effectiveTableId()
    {
        return $this->merged_with_id ?? $this->id;
    }

    public function getEffectiveTable()
    {
        return $this->merged_with_id ? $this->mergedWith : $this;
    }

    public function mergedWith(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'merged_with_id');
    }

    public function mergedTables(): HasMany
    {
        return $this->hasMany(RestaurantTable::class, 'merged_with_id');
    }
}
