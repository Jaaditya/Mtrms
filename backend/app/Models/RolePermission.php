<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    protected $fillable = [
        'tenant_id',
        'module',
        'admin',
        'waiter',
        'kitchen',
        'cashier',
    ];

    protected $casts = [
        'admin' => 'boolean',
        'waiter' => 'boolean',
        'kitchen' => 'boolean',
        'cashier' => 'boolean',
    ];
}
