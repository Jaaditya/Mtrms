<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $tenant = auth()->user()->tenant;
        return response()->json($tenant);
    }

    public function update(Request $request)
    {
        $tenant = auth()->user()->tenant;
        
        $validated = $request->validate([
            'currency' => 'string',
            'timezone' => 'string',
            'auto_print_kot' => 'boolean',
            'sound_notifications' => 'boolean',
            'compact_table_view' => 'boolean',
            'bill_prefix' => 'string',
            'footer_note' => 'nullable|string',
            'kot_printer' => 'nullable|string',
            'bill_printer' => 'nullable|string',
            'vat_no' => 'nullable|string',
            'pan' => 'nullable|string',
            'address' => 'nullable|string',
            'contact' => 'nullable|string',
        ]);

        $tenant->update($validated);

        return response()->json([
            'message' => 'Settings updated successfully',
            'tenant' => $tenant
        ]);
    }
}
