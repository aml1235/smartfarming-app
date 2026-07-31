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

        $avgTemp = round($logs->whereIn('type', ['suhu', 'temperature', 'temp'])->avg('value') ?? 0, 1);
        $avgHum = round($logs->whereIn('type', ['kelembapan', 'humidity', 'hum'])->avg('value') ?? 0, 1);
        $avgWater = round($logs->whereIn('type', ['water_level', 'air', 'waterLevel'])->avg('value') ?? 0, 1);
        $avgLight = round($logs->whereIn('type', ['light_level', 'cahaya', 'lightLevel'])->avg('value') ?? 0, 1);

        $hasHum = $logs->whereIn('type', ['kelembapan', 'humidity', 'hum'])->count() > 0;

        $kesimpulan = "Kondisi sektor terpantau normal.";
        $rekomendasi = "Lanjutkan pemantauan rutin.";
        $status = "Normal";

        $analisa = [];
        if ($avgTemp > 0) {
            if ($avgTemp > 30) {
                $analisa[] = "Suhu rata-rata sangat panas ({$avgTemp}°C).";
                $status = "Peringatan";
            } elseif ($avgTemp < 20) {
                $analisa[] = "Suhu rata-rata cukup dingin ({$avgTemp}°C).";
            } else {
                $analisa[] = "Suhu optimal ({$avgTemp}°C).";
            }
        }

        if ($hasHum) {
            if ($avgHum < 50) {
                $analisa[] = "Kelembapan udara terlalu rendah ({$avgHum}%).";
                if ($status == "Normal") $status = "Perhatian";
            } else {
                $analisa[] = "Kelembapan udara normal ({$avgHum}%).";
            }
        }

        if ($avgWater > 0) {
            if ($avgWater < 30) {
                $analisa[] = "Level air/nutrisi menipis ({$avgWater}%).";
                $status = "Peringatan";
            } else {
                $analisa[] = "Kapasitas air aman ({$avgWater}%).";
            }
        }

        if ($avgLight > 0) {
            if ($avgLight < 200) {
                $analisa[] = "Intensitas cahaya kurang ({$avgLight}).";
            } else {
                $analisa[] = "Intensitas cahaya cukup ({$avgLight}).";
            }
        }

        if (count($analisa) > 0) {
            $kesimpulan = implode(' ', $analisa);
        }

        if ($status == "Peringatan") {
            $rekomendasi = "Segera lakukan tindakan perbaikan (cek pompa/kipas pendingin/level air).";
        } elseif ($status == "Perhatian") {
            $rekomendasi = "Tingkatkan frekuensi penyiraman atau sirkulasi udara.";
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
