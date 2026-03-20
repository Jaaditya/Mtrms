<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Traits\BelongsToTenant;

class Floor extends Model
{
    use BelongsToTenant;

    protected $fillable = ['tenant_id', 'name', 'order_index'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function tables(): HasMany
    {
        return $this->hasMany(RestaurantTable::class, 'floor_id')->orderBy('order_index');
    }
}
