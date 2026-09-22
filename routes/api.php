<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SectorController;
use App\Http\Controllers\NotificationController;

// ── Rute Publik (tanpa auth) ────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:3,1');

// ── Rute Terproteksi (membutuhkan token auth) ───────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // CRUD Users API (admin only — enforced in controller)
    Route::apiResource('users', UserController::class);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);

    // Sektor — list (filtered by role in controller)
    Route::get('/sectors', [SectorController::class, 'index']);

    // Sektor — management (admin only — enforced in controller)
    Route::post('/sectors', [SectorController::class, 'store']);
    Route::put('/sectors/{sector_id}', [SectorController::class, 'update']);
    Route::delete('/sectors/{sector_id}', [SectorController::class, 'destroy']);

    // Sektor — data & kontrol (access checked per-sector in controller)
    Route::get('/sectors/{id}/logs', [SectorController::class, 'logs']);
    Route::get('/sectors/{id}/evaluate', [SectorController::class, 'evaluate']);
    Route::get('/sectors/{id}/ai-analysis', [SectorController::class, 'analyzeSectorWithAi']);
    Route::post('/sector/{sector_id}/control', [SectorController::class, 'control']);
    Route::post('/sector/{sector_id}/config', [SectorController::class, 'configTimer']);
    Route::get('/sectors/{sector_id}/config-status', [SectorController::class, 'configStatus']);

    // Notifikasi (filtered by role in controller)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Log aktivitas (read-only, tersedia untuk semua user yang login)
    Route::get('/activities', function () {
        return response()->json(\App\Models\Activity::orderBy('created_at', 'desc')->take(50)->get());
    });
});
