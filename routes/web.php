<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/reset-password/{token}', function ($token) { return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/reset-password?token=' . $token . '&email=' . request('email')); })->name('password.reset');
