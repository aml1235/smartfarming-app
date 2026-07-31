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
    protected $description = 'Menghapus data riwayat sensor yang lebih tua dari 7 hari';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $thresholdDate = Carbon::now()->subDays(7);
        
        $deletedCount = SensorLog::where('created_at', '<', $thresholdDate)->delete();
        
        $this->info("Berhasil menghapus {$deletedCount} baris data sensor lama.");
    }
}
