<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Floor;
use Illuminate\Http\Request;

class FloorController extends Controller
{
    public function index()
    {
        return Floor::with('tables')->orderBy('order_index')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'order_index' => 'integer',
        ]);

        $floor = Floor::create($validated);
        return response()->json($floor, 201);
    }

    public function update(Request $request, Floor $floor)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'order_index' => 'sometimes|integer',
        ]);

        $floor->update($validated);
        return $floor;
    }

    public function show(Floor $floor)
    {
        return $floor->load('tables');
    }

    public function destroy(Floor $floor)
    {
        $floor->delete();
        return response()->json(null, 204);
    }
}
