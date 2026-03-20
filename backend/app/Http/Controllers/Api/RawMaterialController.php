<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use Illuminate\Http\Request;

class RawMaterialController extends Controller
{
    public function index()
    {
        return RawMaterial::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'current_stock' => 'required|numeric',
            'min_stock_level' => 'required|numeric',
        ]);

        $rawMaterial = RawMaterial::create($validated);
        return response()->json($rawMaterial, 201);
    }

    public function update(Request $request, RawMaterial $rawMaterial)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'unit' => 'sometimes|required|string|max:50',
            'current_stock' => 'sometimes|required|numeric',
            'min_stock_level' => 'sometimes|required|numeric',
        ]);

        $rawMaterial->update($validated);
        return $rawMaterial;
    }

    public function destroy(RawMaterial $rawMaterial)
    {
        $rawMaterial->delete();
        return response()->json(null, 204);
    }
}
