<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'nepali_name',
        'description',
        'image',
        'price',
        'is_available',
        'is_taxable',
        'is_service_chargeable',
        'dietary_tags',
        'spicy_level',
        'preparation_station',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'dietary_tags' => 'array',
        'price' => 'decimal:2',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ItemVariant::class);
    }

    public function addons(): HasMany
    {
        return $this->hasMany(ItemAddon::class);
    }
}
