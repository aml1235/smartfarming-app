<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use App\Models\SensorLog;
use App\Models\Activity;
use Carbon\Carbon;

Schedule::call(function () {
    // Menghapus data sensor lokal yang lebih tua dari 7 hari
    SensorLog::where('created_at', '<', Carbon::now()->subDays(7))->delete();
    
    // Menghapus data sensor di Supabase yang lebih tua dari 7 hari
    $supabaseUrl = config('services.supabase.url');
    $supabaseKey = config('services.supabase.key');
    if ($supabaseUrl && $supabaseKey) {
        $sevenDaysAgo = Carbon::now()->subDays(7)->toIso8601String();
        \Illuminate\Support\Facades\Http::withHeaders([
            'apikey' => $supabaseKey,
            'Authorization' => 'Bearer ' . $supabaseKey
        ])->delete($supabaseUrl . '/rest/v1/sensor_data', [
            'created_at' => 'lt.' . $sevenDaysAgo
        ]);
    }

    // Menghapus log aktivitas yang lebih tua dari 30 hari
    Activity::where('created_at', '<', Carbon::now()->subDays(30))->delete();
})->daily();

