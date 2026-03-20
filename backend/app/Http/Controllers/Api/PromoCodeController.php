<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PromoCode;
use Illuminate\Http\Request;

class PromoCodeController extends Controller
{
    public function index()
    {
        return PromoCode::latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:promo_codes,code',
            'discount_value' => 'required|numeric|min:0',
            'type' => 'required|in:percentage,fixed',
            'expiry_date' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $promo = PromoCode::create($validated);
        return response()->json($promo, 201);
    }

    public function update(Request $request, PromoCode $promoCode)
    {
        $validated = $request->validate([
            'code' => 'sometimes|required|string|unique:promo_codes,code,' . $promoCode->id,
            'discount_value' => 'sometimes|required|numeric|min:0',
            'type' => 'sometimes|required|in:percentage,fixed',
            'expiry_date' => 'nullable|date',
            'is_active' => 'sometimes|boolean',
        ]);

        $promoCode->update($validated);
        return $promoCode;
    }

    public function destroy(PromoCode $promoCode)
    {
        $promoCode->delete();
        return response()->json(null, 204);
    }
}
