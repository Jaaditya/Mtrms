<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\RawMaterialController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\UserController;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderItemController;
use App\Http\Controllers\Api\PaymentController;

use App\Http\Controllers\Api\FinancialSettingsController;
use App\Http\Controllers\Api\DiscountRuleController;
use App\Http\Controllers\Api\PromoCodeController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingsController;
use App\Models\Tenant;

Route::get('/tenant-list', function () {
    return Tenant::where('status', 'active')->get(['id', 'name', 'slug']);
});

Route::middleware(['tenant'])->prefix('public')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/menu-items', [MenuItemController::class, 'index']);
});

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/user/fcm-token', [AuthController::class, 'updateFcmToken']);
    Route::apiResource('tenants', \App\Http\Controllers\Api\TenantController::class);
});

Route::middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::apiResource('role-permissions', \App\Http\Controllers\Api\RolePermissionController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('menu-items', MenuItemController::class);
    Route::apiResource('floors', FloorController::class);
    Route::post('tables/reorder', [TableController::class, 'reorder']);
    Route::post('tables/merge', [TableController::class, 'merge']);
    Route::post('tables/split', [TableController::class, 'split']);
    Route::post('tables/{table}/assign-waiter', [TableController::class, 'assignWaiter']);
    Route::post('tables/{table}/request-bill', [TableController::class, 'requestBillForTable']);
    Route::post('tables/{table}/mark-cleaned', [TableController::class, 'markCleaned']);
    Route::apiResource('tables', TableController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::apiResource('orders', OrderController::class);
    Route::get('waiters/{waiterId}/today-serviced', [OrderController::class, 'getTodayServiced']);
    Route::post('tables/{table}/settle', [PaymentController::class, 'settleTable']);
    Route::post('orders/{order}/payments', [PaymentController::class, 'store']);
    Route::patch('order-items/{orderItem}/status', [OrderItemController::class, 'updateStatus']);
    Route::apiResource('raw-materials', RawMaterialController::class);
    Route::apiResource('purchases', PurchaseController::class)->only(['index', 'store']);
    Route::apiResource('users', UserController::class);

    Route::get('financial-settings', [FinancialSettingsController::class, 'show']);
    Route::put('financial-settings', [FinancialSettingsController::class, 'update']);
    Route::apiResource('discount-rules', DiscountRuleController::class);
    Route::apiResource('promo-codes', PromoCodeController::class);

    // Reports
    Route::get('reports/summary', [ReportController::class, 'getSummary']);
    Route::get('reports/sales', [ReportController::class, 'getSalesData']);
    Route::get('reports/categories', [ReportController::class, 'getCategorySales']);
    Route::get('reports/staff', [ReportController::class, 'getStaffPerformance']);
    Route::get('reports/dashboard', [ReportController::class, 'getDashboardStats']);

    // Settings
    Route::get('settings', [SettingsController::class, 'index']);
    Route::put('settings', [SettingsController::class, 'update']);
});
