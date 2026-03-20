<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tenant;

class FinancialSettingsController extends Controller
{
    public function show()
    {
        $tenantId = auth()->user()->tenant_id;
        return Tenant::find($tenantId, [
            'vat_rate', 
            'service_charge_rate', 
            'is_service_charge_enabled', 
            'tax_type'
        ]);
    }

    public function update(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $tenant = Tenant::findOrFail($tenantId);

        $validated = $request->validate([
            'vat_rate' => 'sometimes|required_with:tax_type|numeric|min:0|max:100',
            'service_charge_rate' => 'sometimes|numeric|min:0|max:100',
            'is_service_charge_enabled' => 'sometimes|boolean',
            'tax_type' => 'sometimes|required|in:inclusive,exclusive',
        ]);

        $tenant->update($validated);

        return $tenant->only([
            'vat_rate', 
            'service_charge_rate', 
            'is_service_charge_enabled', 
            'tax_type'
        ]);
    }
}
