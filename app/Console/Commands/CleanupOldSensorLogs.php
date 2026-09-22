<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SensorLog;
use Carbon\Carbon;

class CleanupOldSensorLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sensor:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Menghapus data riwayat sensor yang lebih tua dari masa simpan yang dikonfigurasi (SENSOR_LOG_RETENTION_DAYS)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = config('smartfarming.retention_days', 30);
        $batas = now()->subDays($days);

        $deletedLogs   = SensorLog::where('created_at', '<', $batas)->delete();
        $deletedNotifs = \App\Models\Notification::where('created_at', '<', $batas)->delete();

        $this->info("Berhasil menghapus {$deletedLogs} data sensor dan {$deletedNotifs} notifikasi yang lebih lama dari {$days} hari.");
    }
}
