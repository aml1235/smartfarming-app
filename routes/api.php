<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;

use App\Http\Controllers\UserController;
use App\Http\Controllers\SectorController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:3,1');

// Public/Simulated Sector Route for Frontend
Route::get('/sectors', [SectorController::class, 'index']);
Route::post('/sector/{sector_id}/control', [SectorController::class, 'control']);
Route::get('/activities', function () {
    return response()->json(\App\Models\Activity::orderBy('created_at', 'desc')->get());
});
Route::post('/activities', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'user_name' => 'required|string',
        'action' => 'required|string',
        'target' => 'required|string',
    ]);
    $act = \App\Models\Activity::create($validated);
    return response()->json($act, 201);
});

// Protected routes (require auth token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // CRUD Users API
    Route::apiResource('users', UserController::class);

    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);
});



// Endpoint untuk menerima data dari perangkat IoT (ESP32 / NodeMCU)
Route::post('/sensors', [\App\Http\Controllers\SensorController::class, 'store']);

// Notification routes
Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
Route::put('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
Route::put('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);

Route::get('/sectors/{id}/evaluate', [\App\Http\Controllers\SectorController::class, 'evaluate']);
