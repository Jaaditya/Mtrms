<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'logo',
        'address',
        'contact',
        'pan',
        'plan',
        'vat_no',
        'status',
        'vat_rate',
        'service_charge_rate',
        'is_service_charge_enabled',
        'tax_type',
        'currency',
        'timezone',
        'auto_print_kot',
        'sound_notifications',
        'compact_table_view',
        'bill_prefix',
        'footer_note',
        'kot_printer',
        'bill_printer',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function floors(): HasMany
    {
        return $this->hasMany(Floor::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
