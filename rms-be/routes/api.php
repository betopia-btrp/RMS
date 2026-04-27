<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

Route::get('/menu', [MenuController::class, 'currentMenu']);
Route::get('/menu/{venue}', [MenuController::class, 'venueMenu']);
Route::get('/venues/{venue}/menu', [MenuController::class, 'venueMenu']);
Route::get('/tables/{table}/menu', [MenuController::class, 'tableMenu']);

Route::post('/login', [AuthController::class, 'login']);
Route::post('/admin/login', [AdminController::class, 'login']);

Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{order}', [OrderController::class, 'show']);
Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
Route::post('/payments/{payment}/receipt', [OrderController::class, 'receipt']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:ADMIN,KITCHEN')->group(function () {
        Route::get('/kitchen/orders', [KitchenController::class, 'orders']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    });

    Route::middleware('role:ADMIN,WAITER')->group(function () {
        Route::get('/staff/ready-orders', [StaffController::class, 'readyOrders']);
        Route::patch('/orders/{order}/serve', [StaffController::class, 'serve']);
        Route::get('/staff/users', [StaffController::class, 'index']);
        Route::patch('/staff/users/{staffUser}', [StaffController::class, 'update']);
    });

    Route::middleware('role:ADMIN')->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/orders', [AdminController::class, 'orders']);
        Route::get('/admin/analytics', [AdminController::class, 'analytics']);
        Route::get('/admin/reports/export', [AdminController::class, 'exportReport']);
        Route::get('/admin/settings', [AdminController::class, 'settings']);
        Route::patch('/admin/staff/{staffUser}', [AdminController::class, 'updateStaff']);
        Route::post('/admin/menu', [MenuController::class, 'store']);
        Route::patch('/admin/menu/{menuItem}', [MenuController::class, 'update']);
        Route::post('/admin/menu-items', [MenuController::class, 'store']);
        Route::patch('/admin/menu-items/{menuItem}', [MenuController::class, 'update']);
        Route::patch('/admin/menu/{menuItem}/availability', [MenuController::class, 'toggle']);
        Route::patch('/admin/menu-items/{menuItem}/availability', [MenuController::class, 'toggle']);
        Route::delete('/admin/menu-items/{menuItem}', [MenuController::class, 'destroy']);
        Route::post('/admin/uploads/menu-image', [UploadController::class, 'storeMenuImage']);
    });
});
