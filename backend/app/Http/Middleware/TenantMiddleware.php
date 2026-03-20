<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->header('X-Tenant-Slug');

        if (!$slug) {
            return response()->json(['message' => 'X-Tenant-Slug header missing'], 400);
        }

        $tenant = Tenant::where('slug', $slug)->first();

        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        session(['tenant_id' => $tenant->id]);

        return $next($request);
    }
}
