<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Catatan: Pembersihan harian (sensor logs, notifikasi, aktivitas)
// sekarang dieksekusi secara otomatis oleh background process (MqttListen.php)
// setiap 6 jam sekali. Tidak perlu lagi memakai Laravel Scheduler di sini.
