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

    public function store(Request $request)
    {
        // Hanya admin yang boleh membuat sektor baru
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'sector_id'           => 'required|string|max:50|unique:sectors,sector_id',
            'name'                => 'required|string|max:255',
            'unit'                => 'required|string|max:100',
            'status'              => 'sometimes|in:baik,normal,peringatan,kritis',
            'metrics'             => 'sometimes|array',
            'mqtt_topic_pattern'  => 'sometimes|nullable|string|max:255',
            'mqtt_broker_config'  => 'sometimes|nullable|array',
            'mqtt_metric_map'     => 'sometimes|nullable|array',
            'mqtt_control_topic'  => 'sometimes|nullable|string|max:255',
        ]);

        $sector = Sector::create([
            'sector_id'           => $validated['sector_id'],
            'name'                => $validated['name'],
            'unit'                => $validated['unit'],
            'status'              => $validated['status'] ?? 'normal',
            'metrics'             => $validated['metrics'] ?? [],
            'mqtt_topic_pattern'  => $validated['mqtt_topic_pattern'] ?? null,
            'mqtt_broker_config'  => $validated['mqtt_broker_config'] ?? null,
            'mqtt_metric_map'     => $validated['mqtt_metric_map']    ?? null,
            'mqtt_control_topic'  => $validated['mqtt_control_topic'] ?? null,
        ]);

        // Catat aktivitas
        \App\Models\Activity::create([
            'user_name' => $request->user() ? $request->user()->name : 'Admin',
            'action'    => 'Menambahkan sektor baru',
            'target'    => $sector->name,
        ]);

        return response()->json($sector, 201);
    }

    public function destroy(Request $request, $sector_id)
    {
        // Hanya admin yang boleh menghapus sektor
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $sector = Sector::where('sector_id', $sector_id)->firstOrFail();
        $sectorName = $sector->name;
        $sector->delete();

        // Catat aktivitas
        \App\Models\Activity::create([
            'user_name' => $request->user() ? $request->user()->name : 'Admin',
            'action'    => 'Menghapus sektor',
            'target'    => $sectorName,
        ]);

        return response()->json(['message' => "Sektor {$sectorName} berhasil dihapus."]);
    }

    public function update(Request $request, $sector_id)
    {
        // Hanya admin yang boleh mengedit sektor
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $sector = Sector::where('sector_id', $sector_id)->firstOrFail();

        $validated = $request->validate([
            'name'               => 'sometimes|string|max:255',
            'unit'               => 'sometimes|string|max:100',
            'status'             => 'sometimes|in:baik,normal,perigatan,kritis',
            'metrics'            => 'sometimes|array',
            'mqtt_topic_pattern' => 'sometimes|nullable|string|max:255',
            'mqtt_broker_config' => 'sometimes|nullable|array',
            'mqtt_metric_map'    => 'sometimes|nullable|array',
            'mqtt_control_topic' => 'sometimes|nullable|string|max:255',
        ]);

        if (isset($validated['name']))               $sector->name               = $validated['name'];
        if (isset($validated['unit']))               $sector->unit               = $validated['unit'];
        if (isset($validated['status']))             $sector->status             = $validated['status'];
        if (isset($validated['metrics']))            $sector->metrics            = array_merge((array)$sector->metrics, $validated['metrics']);
        if (array_key_exists('mqtt_topic_pattern', $validated)) $sector->mqtt_topic_pattern = $validated['mqtt_topic_pattern'];
        if (array_key_exists('mqtt_broker_config', $validated)) $sector->mqtt_broker_config = $validated['mqtt_broker_config'];
        if (array_key_exists('mqtt_metric_map',    $validated)) $sector->mqtt_metric_map    = $validated['mqtt_metric_map'];
        if (array_key_exists('mqtt_control_topic', $validated)) $sector->mqtt_control_topic = $validated['mqtt_control_topic'];

        $sector->save();

        // Catat aktivitas
        \App\Models\Activity::create([
            'user_name' => $request->user() ? $request->user()->name : 'Admin',
            'action'    => 'Mengedit sektor',
            'target'    => $sector->name,
        ]);

        return response()->json($sector);
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
            ->whereNotIn('type', [
                // Status aktuator (bukan angka sensor)
                'lastSync', 'systemStatus',
                'lampStatus', 'conveyorStatus', 'conveyorPhase', 'pumpStatus',
                'lampAutoMode', 'pompaAutoMode',
                // Tegangan/ADC mentah
                'mq135Voltage', 'waterVoltage', 'waterAdc',
                // Jadwal lampu
                'lampOn', 'lampOff',
                // Jadwal & parameter konveyor
                'cv1On', 'cv1Off', 'cv2On', 'cv2Off', 'cv2En',
                'convRun', 'convPause', 'convSpeed',
                'convrun', 'convpause', 'convspeed',
                // Feeder
                'feederStatus', 'lastFeed', 'feederSystemStatus',
                'feedTime1', 'feedTime2', 'feedTime2En',
                'feedDuration', 'feedAngleOpen', 'feedAngleClose',
                'feedAngleOpen2', 'feedAngleClose2', 'feedDistFull', 'feedDistEmpty',
                // Alias lama
                'mq135volt', 'watervoltage', 'wateradc', 'conveyorstatus', 'lampautostatus', 'ph', 'phvalue'
            ])
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
        } elseif (strtolower($id) === 'kandang' || strtolower($id) === 'sec-011') {
            // --- SEKTOR KANDANG AYAM ---
            $hasAmmonia = $logs->whereIn('type', ['ammonia', 'mq135', 'nh3'])->count() > 0;
            $avgAmmonia = $hasAmmonia ? round($logs->whereIn('type', ['ammonia', 'mq135', 'nh3'])->avg('value'), 1) : null;

            // --- Aturan Suhu ---
            if ($hasTemp) {
                if ($avgTemp > 30) {
                    $analisa[] = "Suhu panas ({$avgTemp}°C), rawan Heat Stress.";
                    $status = "Perhatian";
                    $rekomendasiUtama = "Nyalakan kipas exhaust atau perbaiki sirkulasi udara.";
                } elseif ($avgTemp >= 24 && $avgTemp <= 28) {
                    $analisa[] = "Suhu ideal ({$avgTemp}°C).";
                } elseif ($avgTemp < 24) {
                    $analisa[] = "Suhu agak dingin ({$avgTemp}°C).";
                    if ($status == "Normal") $status = "Perhatian";
                } else {
                    $analisa[] = "Suhu cukup aman ({$avgTemp}°C).";
                }
            }

            // --- Aturan Kelembapan ---
            if ($hasHum) {
                if ($avgHum > 75) {
                    $analisa[] = "Kelembapan tinggi ({$avgHum}%), memicu kotoran basah dan amonia.";
                    if ($status != "Peringatan") $status = "Perhatian";
                    if ($rekomendasiUtama == "Lanjutkan pemantauan rutin.") $rekomendasiUtama = "Nyalakan kipas exhaust untuk membuang kelembapan dan amonia.";
                } elseif ($avgHum >= 50 && $avgHum <= 70) {
                    $analisa[] = "Kelembapan ideal ({$avgHum}%).";
                } elseif ($avgHum < 50) {
                    $analisa[] = "Kelembapan rendah ({$avgHum}%), awas debu.";
                } else {
                    $analisa[] = "Kelembapan agak tinggi ({$avgHum}%).";
                }
            }

            // --- Aturan Amonia (NH3) ---
            if ($hasAmmonia) {
                if ($avgAmmonia > 25) {
                    $analisa[] = "Kadar amonia KRITIS ({$avgAmmonia} ppm)! Merusak silia pada saluran pernapasan ayam, risiko kematian massal dan penyakit pernapasan (seperti CRD/Snot) tinggi.";
                    $status = "Peringatan";
                    $rekomendasiUtama = "DARURAT! Segera maksimalkan ventilasi (nyalakan seluruh exhaust), aktifkan conveyor kotoran, dan cek litter.";
                } elseif ($avgAmmonia >= 20 && $avgAmmonia <= 25) {
                    $analisa[] = "Kadar amonia Waspada ({$avgAmmonia} ppm). Ayam mulai rentan iritasi mata, radang tenggorokan, dan nafsu makan turun.";
                    if ($status != "Peringatan") $status = "Perhatian";
                    if ($rekomendasiUtama == "Lanjutkan pemantauan rutin." || $rekomendasiUtama == "Nyalakan kipas exhaust atau perbaiki sirkulasi udara.") {
                        $rekomendasiUtama = "Aktifkan kipas exhaust dan jadwalkan pembersihan kotoran dengan conveyor.";
                    }
                } else {
                    $analisa[] = "Kualitas udara sangat aman ({$avgAmmonia} ppm).";
                }

                // Cek Darurat (Kelembapan tinggi + Amonia tinggi)
                if ($hasHum && $avgHum > 75 && $avgAmmonia >= 20) {
                    $analisa[] = "KONDISI DARURAT: Kelembapan tinggi dan amonia tinggi terjadi bersamaan!";
                    $status = "Peringatan";
                    $rekomendasiUtama = "DARURAT! Segera bersihkan kotoran, keringkan area kandang, dan maksimalkan pembuangan udara.";
                }
            }

            // --- Aturan Level Air ---
            if ($hasWater) {
                // Asumsi water_level dalam persen
                if ($avgWater < 20) {
                    $analisa[] = "Air minum di tandon hampir habis ({$avgWater}%).";
                    if ($status == "Normal") $status = "Perhatian";
                    if ($rekomendasiUtama == "Lanjutkan pemantauan rutin.") $rekomendasiUtama = "Segera nyalakan pompa untuk isi ulang tandon air minum agar ayam tidak dehidrasi.";
                } else {
                    $analisa[] = "Pasokan air minum aman ({$avgWater}%).";
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
            'command' => 'required|string',
            'target'  => 'nullable|string'
        ]);

        $command = $validated['command'];
        $target  = $validated['target'] ?? 'pump';
        
        // Catat aktivitas
        \App\Models\Activity::create([
            'user_name' => auth()->check() ? auth()->user()->name : 'System/Admin',
            'action'    => "Mengubah Kontrol ($command)",
            'target'    => "Sektor $sector_id / $target"
        ]);

        // Publish to MQTT — config broker dibaca dinamis dari DB
        try {
            $sectorModel = \App\Models\Sector::where('sector_id', $sector_id)->first();
            $mqttCfg = $sectorModel
                ? $sectorModel->getMqttConnectionConfig()
                : [
                    'host'     => env('MQTT_HOST', 'broker.hivemq.com'),
                    'port'     => (int) env('MQTT_PORT', 1883),
                    'tls'      => (bool) env('MQTT_TLS', false),
                    'username' => env('MQTT_USERNAME'),
                    'password' => env('MQTT_PASSWORD'),
                ];

            $clientId = 'laravel_pub_' . md5($mqttCfg['host']) . '_' . uniqid();

            $connectionSettings = (new \PhpMqtt\Client\ConnectionSettings)
                ->setUsername($mqttCfg['username'])
                ->setPassword($mqttCfg['password'])
                ->setUseTls($mqttCfg['tls']);

            $mqtt = new \PhpMqtt\Client\MqttClient($mqttCfg['host'], $mqttCfg['port'], $clientId);
            $mqtt->connect($connectionSettings, true);

            // Gunakan mqtt_control_topic dari DB, fallback ke format lama
            $controlBaseTopic = $sectorModel?->mqtt_control_topic
                ?? "smartfarming/hydroponic/cmd";

            // Deteksi apakah ini broker smartcoop (berdasarkan control topic)
            $isSmartcoop = str_starts_with($controlBaseTopic, 'smartcoop');

            if ($isSmartcoop) {
                // Format kontrol smartcoop: 1/0 atau string khusus
                if ($target === 'convjog') {
                    $mqtt->publish("{$controlBaseTopic}/convjog", $command, 1);

                } elseif ($target === 'pompaauto') {
                    $payload = (strtoupper($command) === 'ON' || $command === '1') ? '1' : '0';
                    $mqtt->publish("{$controlBaseTopic}/pompaauto", $payload, 1);

                    // Update optimistis di DB
                    if ($sectorModel) {
                        $metrics = is_string($sectorModel->metrics)
                            ? json_decode($sectorModel->metrics, true)
                            : ($sectorModel->metrics ?? []);
                        $metrics['pompaAutoMode'] = $payload;
                        $sectorModel->metrics = $metrics;
                        $sectorModel->save();
                    }

                } else {
                    $smartcoopTarget = $target;
                    $payload = (strtoupper($command) === 'ON' || $command === '1') ? '1' : '0'; // default

                    if ($target === 'lamp') {
                        $smartcoopTarget = 'lampu';
                        $payload = (strtoupper($command) === 'ON' || $command === '1') ? 'on' : 'off';
                    } elseif ($target === 'pompa') {
                        $smartcoopTarget = 'pompa';
                        $payload = (strtoupper($command) === 'ON' || $command === '1') ? 'isi' : 'stop';
                    } elseif ($target === 'feeder') {
                        $smartcoopTarget = 'servo';
                        $payload = (strtoupper($command) === 'ON' || $command === '1') ? 'buka' : 'tutup';
                    } elseif ($target === 'conveyor') {
                        $smartcoopTarget = 'pakan';
                        $payload = 'mulai';
                        if (strtoupper($command) === 'OFF' || $command === '0') {
                            $smartcoopTarget = 'motor';
                            $payload = 'stop';
                        }
                    } elseif ($target === 'convjog') {
                        $smartcoopTarget = 'motor';
                        if ($command === 'fwd' || $command === 'maju') $payload = 'maju';
                        elseif ($command === 'rev' || $command === 'mundur') $payload = 'mundur';
                        else $payload = 'stop';
                    } elseif ($target === 'lampauto' || $target === 'pompaauto') {
                        $smartcoopTarget = ($target === 'lampauto') ? '../config/oto_lampu' : '../config/oto_pompa';
                        $payload = (strtoupper($command) === 'ON' || $command === '1') ? '1' : '0';
                    } elseif ($target === 'reset') {
                        // Support reset motor/pompa if needed
                        $smartcoopTarget = 'reset';
                        $payload = $command;
                    }

                    $topic = "{$controlBaseTopic}/{$smartcoopTarget}";
                    $topic = str_replace('control/../config', 'config', $topic);

                    $mqtt->publish($topic, $payload, 1);

                    // V3 fallback
                    $v3Topic  = "smartfarming/poultry/cmd/{$sector_id}";
                    $v3Target = $target;
                    if ($target === 'conveyor') $v3Target = 'motor';
                    if ($target === 'lampauto') $v3Target = 'lampAutoMode';
                    $mqtt->publish($v3Topic, json_encode([$v3Target => strtoupper($command) === 'ON' ? 'ON' : 'OFF']), 0);
                }
            } else {
                // Format kontrol umum — JSON
                $topic   = "{$controlBaseTopic}/{$sector_id}";
                $payload = json_encode(['status' => $command]);
                $mqtt->publish($topic, $payload, 0);
            }

            $mqtt->disconnect();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('MQTT Publish Error: ' . $e->getMessage());
            return response()->json([
                'message' => "Gagal mengirim perintah ke sektor $sector_id via MQTT",
                'error'   => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => "Perintah $command berhasil dikirim ke $target sektor $sector_id via MQTT"
        ]);
    }

    public function configTimer(Request $request, $sector_id)
    {
        $validated = $request->validate([
            'target' => 'required|string', // e.g. lampon, lampoff
            'value' => 'required|string'   // e.g. 18:00
        ]);

        $target = $validated['target'];
        $value = $validated['value'];

        \App\Models\Activity::create([
            'user_name' => auth()->check() ? auth()->user()->name : 'System/Admin',
            'action' => "Mengubah Jadwal $target menjadi $value",
            'target' => "Sektor $sector_id"
        ]);

        try {
            $sectorModel = \App\Models\Sector::where('sector_id', $sector_id)->first();
            if (!$sectorModel) {
                return response()->json(['message' => 'Sektor tidak ditemukan'], 404);
            }

            $mqttCfg = $sectorModel->getMqttConnectionConfig();
            $clientId = 'laravel_cfg_' . md5($mqttCfg['host']) . '_' . uniqid();

            $connectionSettings = (new \PhpMqtt\Client\ConnectionSettings)
                ->setUsername($mqttCfg['username'])
                ->setPassword($mqttCfg['password'])
                ->setUseTls($mqttCfg['tls']);

            $mqtt = new \PhpMqtt\Client\MqttClient($mqttCfg['host'], $mqttCfg['port'], $clientId);
            $mqtt->connect($connectionSettings, true);

            // Derive config topic dari control topic (ganti 'control' → 'config')
            $controlBase  = $sectorModel->mqtt_control_topic ?? 'smartcoop/control';
            $configBase   = str_replace('/control', '/config', $controlBase);
            $topic        = "{$configBase}/{$target}";
            $mqtt->publish($topic, $value, 1);
            $mqtt->disconnect();

            // Optimistic update ke DB — gunakan metric_map dari sektor jika ada
            $metricMap = $sectorModel->mqtt_metric_map ?? [
                'lampon'      => 'lampOn',
                'lampoff'     => 'lampOff',
                'conveyoron'  => 'cv1On',
                'conveyor2on' => 'cv2On',
                'conveyor2en' => 'cv2En',
                'convrun'     => 'convRun',
                'convpause'   => 'convPause',
                'convspeed'   => 'convSpeed',
                'feedtime1'   => 'feedTime1',
                'feedtime2'   => 'feedTime2',
                'feedtime2en' => 'feedTime2En',
                'feedduration'=> 'feedDuration',
            ];
            $dbKey   = $metricMap[$target] ?? $target;
            $metrics = is_string($sectorModel->metrics)
                ? json_decode($sectorModel->metrics, true)
                : ($sectorModel->metrics ?? []);
            $metrics[$dbKey]  = $value;
            $sectorModel->metrics = $metrics;
            $sectorModel->save();

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('MQTT Publish Error (Config): ' . $e->getMessage());
            return response()->json([
                'message' => "Gagal mengirim konfigurasi ke sektor $sector_id via MQTT",
                'error'   => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => "Konfigurasi jadwal berhasil dikirim via MQTT"
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

    public function analyzeSectorWithAi($id)
    {
        $sector = \App\Models\Sector::where('sector_id', $id)->first();
        if (!$sector) {
            return response()->json([
                'status' => 'Error',
                'kesimpulan' => 'Sektor tidak ditemukan.'
            ], 404);
        }

        $metrics = is_string($sector->metrics) ? json_decode($sector->metrics, true) : $sector->metrics;
        
        if (empty($metrics)) {
            return response()->json([
                'status' => 'Data Kosong',
                'kesimpulan' => 'Belum ada data sensor untuk sektor ini.'
            ]);
        }

        $aiService = new \App\Services\AiExpertService();
        $analisis = $aiService->analyzeSensorData($sector, $metrics);

        return response()->json([
            'status' => 'Berhasil',
            'analisis_ai' => $analisis
        ]);
    }
}
