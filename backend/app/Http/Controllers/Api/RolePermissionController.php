<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RolePermission;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $permissions = RolePermission::where('tenant_id', $tenantId)->get();
        
        // If empty, initialize with defaults
        if ($permissions->isEmpty()) {
            $defaults = [
                ['module' => 'Menu Management', 'admin' => true, 'waiter' => false, 'kitchen' => false, 'cashier' => false],
                ['module' => 'Order View', 'admin' => true, 'waiter' => true, 'kitchen' => true, 'cashier' => true],
                ['module' => 'Reports', 'admin' => true, 'waiter' => false, 'kitchen' => false, 'cashier' => false],
                ['module' => 'Inventory', 'admin' => true, 'waiter' => false, 'kitchen' => true, 'cashier' => false],
                ['module' => 'Settings', 'admin' => true, 'waiter' => false, 'kitchen' => false, 'cashier' => false],
                ['module' => 'User Management', 'admin' => true, 'waiter' => false, 'kitchen' => false, 'cashier' => false],
            ];

            foreach ($defaults as $item) {
                $item['tenant_id'] = $tenantId;
                RolePermission::create($item);
            }
            $permissions = RolePermission::where('tenant_id', $tenantId)->get();
        }

        return response()->json($permissions);
    }

    public function update(Request $request, RolePermission $rolePermission)
    {
        $validated = $request->validate([
            'admin' => 'boolean',
            'waiter' => 'boolean',
            'kitchen' => 'boolean',
            'cashier' => 'boolean',
        ]);

        $rolePermission->update($validated);

        return response()->json($rolePermission);
    }
}
