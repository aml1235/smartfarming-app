<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sector;
use App\Models\SensorLog;

class SectorController extends Controller
{
    public function index()
    {
        return response()->json(Sector::all());
    }

    public function logs($id)
    {
        $logs = SensorLog::where('sector_id', $id)
            ->where('created_at', '>=', now()->subHours(24))
            ->orderBy('created_at', 'asc')
            ->get();

        // Group by time
        $formattedLogs = [];
        foreach ($logs as $log) {
            $time = $log->created_at->format('H:i');
            if (!isset($formattedLogs[$time])) {
                $formattedLogs[$time] = ['time' => $time];
            }
            $formattedLogs[$time][$log->type] = $log->value;
        }

        return response()->json(array_values($formattedLogs));
    }

    public function evaluate($id)
    {
        $logs = SensorLog::where('sector_id', $id)
            ->where('created_at', '>=', now()->subHours(24))
            ->get();

        if ($logs->isEmpty()) {
            return response()->json([
                'status' => 'Data Tidak Cukup',
                'kesimpulan' => 'Belum ada data sensor dalam 24 jam terakhir untuk dianalisa.',
                'rekomendasi' => 'Pastikan alat IoT menyala dan terhubung ke jaringan.'
            ]);
        }

        // Contoh Rule-Based Logic sederhana
        $avgTemp = round($logs->whereIn('type', ['suhu', 'temperature', 'temp'])->avg('value') ?? 0, 1);
        $avgHum = round($logs->whereIn('type', ['kelembapan', 'humidity', 'hum'])->avg('value') ?? 0, 1);

        $kesimpulan = "Kondisi sektor terpantau normal berdasarkan rata-rata suhu {$avgTemp}C dan kelembapan {$avgHum}%.";
        $rekomendasi = "Lanjutkan pemantauan rutin.";
        $status = "Normal";

        if ($avgTemp > 30) {
            $kesimpulan = "Suhu rata-rata sangat panas ({$avgTemp}C).";
            $rekomendasi = "Nyalakan kipas pendingin atau semprotan air untuk menurunkan suhu.";
            $status = "Peringatan";
        } elseif ($avgHum > 0 && $avgHum < 50) {
            $kesimpulan = "Kelembapan terlalu rendah ({$avgHum}%).";
            $rekomendasi = "Nyalakan pompa air/irigasi untuk menjaga kelembapan.";
            $status = "Perhatian";
        }

        return response()->json([
            'status' => $status,
            'kesimpulan' => $kesimpulan,
            'rekomendasi' => $rekomendasi,
            'data_points' => count($logs)
        ]);
    }

    public function control(Request $request, $sector_id)
    {
        $validated = $request->validate([
            'command' => 'required|in:ON,OFF'
        ]);

        $command = $validated['command'];
        
        // Catat aktivitas (Opsional, agar muncul di activity log)
        \App\Models\Activity::create([
            'user_name' => auth()->check() ? auth()->user()->name : 'System/Admin',
            'action' => "Mematikan/Menghidupkan Pompa ($command)",
            'target' => "Sektor $sector_id"
        ]);

        // Simpan command di cache (berlaku selama 5 menit)
        \Illuminate\Support\Facades\Cache::put("pump_command_{$sector_id}", $command, now()->addMinutes(5));

        return response()->json([
            'message' => "Perintah $command berhasil dikirim ke pompa sektor $sector_id"
        ]);
    }

    public function getPumpCommand($id)
    {
        $command = \Illuminate\Support\Facades\Cache::get("pump_command_{$id}");
        
        if ($command) {
            return response()->json([
                'status' => $command,
                'executed' => false
            ]);
        }

        return response()->json([
            'status' => 'OFF', // default if no pending command
            'executed' => true
        ]);
    }

    public function acknowledgePumpCommand($id)
    {
        \Illuminate\Support\Facades\Cache::forget("pump_command_{$id}");
        return response()->json(['message' => 'Command acknowledged']);
    }
}
