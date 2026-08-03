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
        $latestLog = SensorLog::where('sector_id', $id)->latest('created_at')->first();

        if (!$latestLog) {
            return response()->json([]);
        }

        $endTime = $latestLog->created_at;
        $startTime = (clone $endTime)->subHours(24);

        $logs = SensorLog::where('sector_id', $id)
            ->where('created_at', '>=', $startTime)
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
        $latestLog = SensorLog::where('sector_id', $id)->latest('created_at')->first();

        if (!$latestLog) {
            return response()->json([
                'status' => 'Data Tidak Cukup',
                'kesimpulan' => 'Belum ada data sensor sama sekali di database lokal.',
                'rekomendasi' => 'Pastikan alat IoT menyala dan terhubung ke jaringan.'
            ]);
        }

        $endTime = $latestLog->created_at;
        $startTime = (clone $endTime)->subHours(24);

        $logs = SensorLog::where('sector_id', $id)
            ->where('created_at', '>=', $startTime)
            ->get();

        $hasTemp = $logs->whereIn('type', ['suhu', 'temperature', 'temp'])->count() > 0;
        $hasHum = $logs->whereIn('type', ['kelembapan', 'humidity', 'hum'])->count() > 0;
        $hasWater = $logs->whereIn('type', ['water_level', 'air', 'waterLevel'])->count() > 0;
        $hasLight = $logs->whereIn('type', ['light_level', 'cahaya', 'lightLevel'])->count() > 0;

        $avgTemp = $hasTemp ? round($logs->whereIn('type', ['suhu', 'temperature', 'temp'])->avg('value'), 1) : null;
        $avgHum = $hasHum ? round($logs->whereIn('type', ['kelembapan', 'humidity', 'hum'])->avg('value'), 1) : null;
        $avgWater = $hasWater ? round($logs->whereIn('type', ['water_level', 'air', 'waterLevel'])->avg('value'), 1) : null;
        $avgLight = $hasLight ? round($logs->whereIn('type', ['light_level', 'cahaya', 'lightLevel'])->avg('value'), 1) : null;

        $status = "Normal";
        $analisa = [];
        $rekomendasiUtama = "Lanjutkan pemantauan rutin.";

        // --- SEKTOR HIDROPONIK ---
        if (strtolower($id) === 'hidroponik' || strtolower($id) === 'sec-010') {
            // --- Aturan Suhu ---
            if ($hasTemp) {
                if ($avgTemp <= 0 || $avgTemp > 50) {
                    $analisa[] = "Suhu ({$avgTemp}°C) tidak masuk akal. Kemungkinan sensor rusak/terputus atau terkena panas langsung.";
                    $status = "Perhatian";
                    $rekomendasiUtama = "Periksa kabel atau posisi sensor suhu DHT22.";
                } elseif ($avgTemp > 38) {
                    $analisa[] = "Suhu sangat panas ({$avgTemp}°C).";
                    $status = "Peringatan";
                    $rekomendasiUtama = "Nyalakan pompa untuk mendinginkan akar, atau nyalakan kipas/buka ventilasi greenhouse.";
                } elseif ($avgTemp >= 30 && $avgTemp <= 38) {
                    $analisa[] = "Suhu normal siang hari tropis ({$avgTemp}°C).";
                } else {
                    $analisa[] = "Suhu sejuk/dingin ({$avgTemp}°C).";
                }
            }

            // --- Aturan Kelembapan ---
            if ($hasHum) {
                if ($avgHum <= 0 || $avgHum > 100) {
                    $analisa[] = "Data kelembapan ({$avgHum}%) tidak valid, cek sensor.";
                    if ($status == "Normal") $status = "Perhatian";
                } elseif ($avgHum > 80) {
                    $analisa[] = "Kelembapan tinggi ({$avgHum}%), sirkulasi buruk dan rawan jamur.";
                    if ($status != "Peringatan") $status = "Perhatian";
                    if ($rekomendasiUtama == "Lanjutkan pemantauan rutin.") $rekomendasiUtama = "Tingkatkan sirkulasi udara (nyalakan kipas/buka ventilasi) untuk mencegah jamur.";
                } elseif ($avgHum < 50) {
                    $analisa[] = "Kelembapan rendah ({$avgHum}%), tanaman cepat dehidrasi.";
                    if ($status != "Peringatan") $status = "Perhatian";
                    if ($rekomendasiUtama == "Lanjutkan pemantauan rutin.") $rekomendasiUtama = "Pastikan pasokan nutrisi/air mencukupi agar tanaman tidak layu.";
                } else {
                    $analisa[] = "Kelembapan ideal ({$avgHum}%).";
                }
            }

            // --- Aturan Cahaya ---
            if ($hasLight) {
                if ($avgLight <= 0) {
                    $analisa[] = "Cahaya 0%, kemungkinan sensor LDR tertutup atau malam hari.";
                } elseif ($avgLight < 30) {
                    $analisa[] = "Terlalu gelap ({$avgLight}%), butuh grow light atau buka naungan.";
                    if ($status == "Normal") $status = "Perhatian";
                    if ($rekomendasiUtama == "Lanjutkan pemantauan rutin.") $rekomendasiUtama = "Berikan tambahan pencahayaan buatan (grow light) atau singkirkan peneduh.";
                } elseif ($avgLight > 80) {
                    $analisa[] = "Sangat terik ({$avgLight}%), cek suhu.";
                } else {
                    $analisa[] = "Cahaya ideal ({$avgLight}%).";
                }
            }

            // --- Aturan Level Air (Jarak Sensor ke Air dalam cm) ---
            if ($hasWater) {
                if ($avgWater <= 0 || $avgWater > 400) {
                    $analisa[] = "Pembacaan ultrasonik tidak valid ({$avgWater} cm), cek sensor.";
                    if ($status == "Normal") $status = "Perhatian";
                } elseif ($avgWater > 20) {
                    $analisa[] = "Tandon air hampir kosong (jarak {$avgWater} cm).";
                    $status = "Peringatan";
                    $rekomendasiUtama = "Segera isi ulang air tandon dan tambahkan nutrisi AB Mix.";
                } elseif ($avgWater < 5) {
                    $analisa[] = "Tandon penuh (jarak {$avgWater} cm).";
                } else {
                    $analisa[] = "Volume air tandon cukup (jarak {$avgWater} cm).";
                }
            }
        } else {
            // --- SEKTOR UMUM / DEFAULT ---
            if ($hasTemp) {
                if ($avgTemp > 35) {
                    $analisa[] = "Suhu relatif tinggi ({$avgTemp}°C).";
                    $status = "Perhatian";
                } else {
                    $analisa[] = "Suhu normal ({$avgTemp}°C).";
                }
            }

            if ($hasHum) {
                if ($avgHum > 85) {
                    $analisa[] = "Kelembapan tinggi ({$avgHum}%).";
                    if ($status == "Normal") $status = "Perhatian";
                } else {
                    $analisa[] = "Kelembapan terpantau aman.";
                }
            }
            
            $rekomendasiUtama = ($status == "Perhatian" || $status == "Peringatan") 
                                ? "Lakukan pengecekan sistem sirkulasi udara dan air." 
                                : "Lanjutkan pemantauan harian rutin.";
        }

        $kesimpulan = count($analisa) > 0 ? implode(' ', $analisa) : "Data sensor tidak lengkap untuk dianalisis.";

        return response()->json([
            'status' => $status,
            'kesimpulan' => $kesimpulan,
            'rekomendasi' => $rekomendasiUtama,
            'data_points' => count($logs)
        ]);
    }

    public function control(Request $request, $sector_id)
    {
        $validated = $request->validate([
            'command' => 'required|in:ON,OFF',
            'target' => 'nullable|string'
        ]);

        $command = $validated['command'];
        $target = $validated['target'] ?? 'pump';
        
        // Catat aktivitas (Opsional, agar muncul di activity log)
        \App\Models\Activity::create([
            'user_name' => auth()->check() ? auth()->user()->name : 'System/Admin',
            'action' => "Mematikan/Menghidupkan Pompa ($command)",
            'target' => "Sektor $sector_id"
        ]);

        // Publish to MQTT
        try {
            $server   = env('MQTT_HOST', 'broker.hivemq.com');
            $port     = env('MQTT_PORT', 1883);
            $clientId = env('MQTT_CLIENT_ID', 'laravel_pub_' . uniqid());
            $username = env('MQTT_USERNAME');
            $password = env('MQTT_PASSWORD');

            $connectionSettings = (new \PhpMqtt\Client\ConnectionSettings)
                ->setUsername($username)
                ->setPassword($password)
                ->setUseTls(env('MQTT_TLS', false));

            $mqtt = new \PhpMqtt\Client\MqttClient($server, $port, $clientId);
            $mqtt->connect($connectionSettings, true);
            
            if ($sector_id === 'SEC-011' || $sector_id === 'kandang') {
                // Kandang Ayam (smartcoop)
                $mqttTarget = $target; // e.g. lamp, conveyor, lampauto
                $topic = "smartcoop/control/{$mqttTarget}";
                $payload = ($command === 'ON') ? "1" : "0";
                $mqtt->publish($topic, $payload, 1);
            } else {
                // Hydroponic or default
                $topic = "smartfarming/hydroponic/cmd/{$sector_id}";
                $payload = json_encode(['status' => $command]);
                $mqtt->publish($topic, $payload, 0);
            }
            
            $mqtt->disconnect();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('MQTT Publish Error: ' . $e->getMessage());
            return response()->json([
                'message' => "Gagal mengirim perintah ke pompa sektor $sector_id via MQTT",
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => "Perintah $command berhasil dikirim ke pompa sektor $sector_id via MQTT"
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
