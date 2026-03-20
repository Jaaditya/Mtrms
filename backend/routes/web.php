<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\GuestMenuController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/menu/{tenant}/{table}', [GuestMenuController::class, 'show'])->name('guest.menu');
Route::get('/menu/{tenant}/{table}/bill', [GuestMenuController::class, 'showBill']);
Route::post('/menu/{tenant}/{table}/order', [GuestMenuController::class, 'storeOrder'])->name('guest.store-order');
Route::post('/menu/{tenant}/{table}/call-waiter', [GuestMenuController::class, 'callWaiter'])->name('guest.call-waiter');
Route::post('/menu/{tenant}/{table}/request-bill', [GuestMenuController::class, 'requestBill'])->name('guest.request-bill');
