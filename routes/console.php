<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

// Pembersihan harian: sensor logs, notifikasi (7 hari), dan aktivitas (30 hari)
Schedule::command('sensor:cleanup')->daily();

Schedule::call(function () {
    \App\Models\Activity::where('created_at', '<', now()->subDays(30))->delete();
})->daily();
