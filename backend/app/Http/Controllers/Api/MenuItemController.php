<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    public function index(Request $request)
    {
        $query = MenuItem::with(['category', 'variants', 'addons']);
        
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'nepali_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'is_available' => 'boolean',
            'dietary_tags' => 'nullable|array',
            'spicy_level' => 'nullable|integer|min:0|max:4',
            'preparation_station' => 'nullable|string|max:255',
            'image' => 'nullable|string',
        ]);

        $menuItem = MenuItem::create($validated);

        return response()->json($menuItem, 201);
    }

    public function show(MenuItem $menuItem)
    {
        return $menuItem->load(['category', 'variants', 'addons']);
    }

    public function update(Request $request, MenuItem $menuItem)
    {
        $validated = $request->validate([
            'category_id' => 'exists:categories,id',
            'name' => 'string|max:255',
            'nepali_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'price' => 'numeric',
            'is_available' => 'boolean',
            'dietary_tags' => 'nullable|array',
            'spicy_level' => 'nullable|integer|min:0|max:4',
            'preparation_station' => 'nullable|string|max:255',
            'image' => 'nullable|string',
        ]);

        $menuItem->update($validated);

        return $menuItem;
    }

    public function destroy(MenuItem $menuItem)
    {
        $menuItem->delete();
        return response()->json(null, 204);
    }
}
