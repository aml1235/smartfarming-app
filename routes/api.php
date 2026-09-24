<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SectorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ActivityController;

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

    // Log aktivitas (ActivityController::index mendukung ?limit=N dan ?user_id=X (admin only))
    Route::get('/activities', [ActivityController::class, 'index']);

    // ── Otorisasi Pusher Private Channel via Sanctum ──────────────────────
    // Endpoint ini digunakan Pusher JS saat subscribe ke private-sector.{id}.
    // Menggunakan auth:sanctum (Bearer token) — bukan web middleware default.
    // authEndpoint di frontend: ${API_URL}/api/broadcasting/auth
    Route::post('/broadcasting/auth', function (Request $request) {
        return Broadcast::auth($request);
    });
});
