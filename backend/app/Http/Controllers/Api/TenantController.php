<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tenants = \App\Models\Tenant::withCount(['users', 'orders'])->get();
        return response()->json($tenants);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'contact' => 'nullable|string|max:20',
            'pan' => 'nullable|string|max:20',
            'plan' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
        ]);

        $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']) . '-' . rand(1000, 9999);
        $validated['status'] = $validated['status'] ?? 'Active';
        $validated['plan'] = $validated['plan'] ?? 'Basic';

        $tenant = \App\Models\Tenant::create($validated);

        return response()->json($tenant, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(\App\Models\Tenant $tenant)
    {
        return response()->json($tenant);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, \App\Models\Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'contact' => 'nullable|string|max:20',
            'pan' => 'nullable|string|max:20',
            'plan' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $tenant->name) {
             $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']) . '-' . rand(1000, 9999);
        }

        $tenant->update($validated);

        return response()->json($tenant);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(\App\Models\Tenant $tenant)
    {
        $tenant->delete();
        return response()->json(null, 204);
    }
}
