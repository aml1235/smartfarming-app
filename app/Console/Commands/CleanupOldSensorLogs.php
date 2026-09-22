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
        $days = config('smartfarming.retention_days', 7);
        $batas = now()->subDays($days);

        $deletedLogs   = SensorLog::where('created_at', '<', $batas)->delete();
        $deletedNotifs = \App\Models\Notification::where('created_at', '<', $batas)->delete();

        // Hapus aktivitas yang lebih lama dari 7 hari (hardcoded, bisa dipindah ke config juga nanti jika perlu)
        $deletedActs = \App\Models\Activity::where('created_at', '<', now()->subDays(7))->delete();

        $this->info("Berhasil menghapus {$deletedLogs} data sensor dan {$deletedNotifs} notifikasi (>{$days} hari), serta {$deletedActs} aktivitas (>7 hari).");
    }
}
