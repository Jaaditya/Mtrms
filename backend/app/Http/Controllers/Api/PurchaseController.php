<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function index()
    {
        return Purchase::with('rawMaterial')->orderBy('purchase_date', 'desc')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'raw_material_id' => 'required|exists:raw_materials,id',
            'supplier_name' => 'required|string|max:255',
            'quantity' => 'required|numeric',
            'cost' => 'required|numeric',
            'purchase_date' => 'required|date',
        ]);

        $purchase = Purchase::create($validated);
        
        // Update stock of the raw material
        $rawMaterial = $purchase->rawMaterial;
        $rawMaterial->increment('current_stock', $purchase->quantity);

        return response()->json($purchase->load('rawMaterial'), 201);
    }
}
