<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiscountRule;
use Illuminate\Http\Request;

class DiscountRuleController extends Controller
{
    public function index()
    {
        return DiscountRule::latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:Bill Level,Item Level',
            'value' => 'required|numeric|min:0',
            'conditions' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $rule = DiscountRule::create($validated);
        return response()->json($rule, 201);
    }

    public function update(Request $request, DiscountRule $discountRule)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:Bill Level,Item Level',
            'value' => 'sometimes|required|numeric|min:0',
            'conditions' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        $discountRule->update($validated);
        return $discountRule;
    }

    public function destroy(DiscountRule $discountRule)
    {
        $discountRule->delete();
        return response()->json(null, 204);
    }
}
