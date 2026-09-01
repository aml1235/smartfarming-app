<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;
use App\Models\SensorLog;
use App\Models\Sector;
use Exception;

/**
 * MqttListen — Config-Driven MQTT Listener
 *
 * Semua konfigurasi broker, topic, dan metric mapping dibaca dari tabel `sectors`.
 * Untuk menambah sektor baru (bahkan dari broker berbeda), cukup:
 *   1. Tambah sektor melalui UI (atau DB langsung)
 *   2. Isi kolom: mqtt_topic_pattern, mqtt_broker_config, mqtt_metric_map
 *   3. Restart process ini — TIDAK perlu ubah code sama sekali.
 *
 * Cara jalankan:
 *   php artisan mqtt:listen                    → connect ke semua broker
 *   php artisan mqtt:listen --broker-host=xxx  → hanya untuk broker tertentu (untuk multi-process)
 */
class MqttListen extends Command
{
    protected $signature = 'mqtt:listen
                            {--broker-host= : Hanya listen broker dengan host ini (untuk multi-process per broker)}';

    protected $description = 'Listen ke semua MQTT broker yang dikonfigurasi di tabel sectors';

    // Default validTypes untuk sektor yang tidak punya mqtt_metric_map
    private const DEFAULT_VALID_TYPES = [
        'temperature', 'humidity', 'waterLevel', 'lightLevel',
        'water_level', 'light_level', 'pumpStatus', 'pump_status',
        'lampStatus', 'exhaustStatus', 'motorStatus', 'lampAutoMode',
    ];

    // Tipe yang TIDAK disimpan ke sensor_logs (hanya ke metrics)
    private const NON_LOG_TYPES = [
        'lastSync', 'systemStatus',
        'lampStatus', 'conveyorStatus', 'conveyorPhase', 'pumpStatus',
        'lampAutoMode', 'pompaAutoMode',
        'mq135Voltage', 'waterVoltage', 'waterAdc',
        'lampOn', 'lampOff',
        'cv1On', 'cv2On', 'cv2En',
        'convRun', 'convPause', 'convSpeed',
        'feederStatus', 'lastFeed', 'feederSystemStatus',
        'feedTime1', 'feedTime2', 'feedTime2En', 'feedDuration',
        'feedAngleOpen', 'feedAngleClose', 'feedAngleOpen2', 'feedAngleClose2',
        'feedDistFull', 'feedDistEmpty',
    ];

    public function handle()
    {
        date_default_timezone_set('Asia/Jakarta');
        config(['app.timezone' => 'Asia/Jakarta']);

        $filterHost = $this->option('broker-host');

        // ── 1. Baca semua sektor yang sudah dikonfigurasi MQTT ──────────────
        $sectors = Sector::whereNotNull('mqtt_topic_pattern')->get();

        if ($sectors->isEmpty()) {
            $this->error('Tidak ada sektor dengan mqtt_topic_pattern di database.');
            $this->info('Tambahkan sektor melalui UI atau jalankan seeder: php artisan db:seed --class=UpdateSectorsMqttConfig');
            return;
        }

        // ── 2. Group sektor berdasarkan fingerprint broker ──────────────────
        // Sektor dengan broker yang sama digroup ke 1 koneksi MQTT.
        $brokerGroups = [];
        foreach ($sectors as $sector) {
            $fingerprint = $sector->getBrokerFingerprint();

            // Jika mode filter aktif, skip broker yang tidak cocok
            if ($filterHost && $fingerprint !== $filterHost) {
                continue;
            }

            $brokerGroups[$fingerprint]['config']    = $sector->getMqttConnectionConfig();
            $brokerGroups[$fingerprint]['sectors'][] = $sector;
        }

        if (empty($brokerGroups)) {
            $this->error("Tidak ada broker yang cocok" . ($filterHost ? " dengan host '{$filterHost}'" : '') . ".");
            return;
        }

        $this->info('📡 Ditemukan ' . count($brokerGroups) . ' broker grup:');
        foreach ($brokerGroups as $fp => $group) {
            $topicList = collect($group['sectors'])->pluck('mqtt_topic_pattern')->join(', ');
            $this->info("   • {$fp} → [{$topicList}]");
        }

        // ── 3. Jika lebih dari 1 broker & tidak ada filter, hanya proses broker pertama ──
        // Untuk menjalankan semua broker secara paralel, jalankan:
        //   php artisan mqtt:listen --broker-host=<host1>
        //   php artisan mqtt:listen --broker-host=<host2>
        if (count($brokerGroups) > 1 && !$filterHost) {
            $this->warn('⚠️  Ada lebih dari 1 broker. Process ini akan menangani SEMUA broker secara bergantian (round-robin non-blocking).');
            $this->warn('   Untuk isolasi penuh, jalankan satu process per broker dengan --broker-host=<host>');
        }

        // ── 4. Jalankan listener untuk setiap broker grup ───────────────────
        if (count($brokerGroups) > 1) {
            $this->info('🚀 Starting multiple workers for ' . count($brokerGroups) . ' brokers...');
            $processes = [];
            foreach ($brokerGroups as $fingerprint => $group) {
                // Gunakan argumen khusus untuk spawn worker khusus broker ini
                $process = new \Symfony\Component\Process\Process(['php', 'artisan', 'mqtt:listen', '--broker-host=' . $fingerprint]);
                $process->setTimeout(null);
                $process->start();
                $processes[] = $process;
                $this->info("   ↳ Worker started for {$fingerprint}");
            }
            // Biarkan master tetap hidup dan monitor worker
            $lastPrune = time();
            while (true) {
                foreach ($processes as $p) {
                    if ($p->isRunning()) {
                        echo $p->getIncrementalOutput();
                        echo $p->getIncrementalErrorOutput();
                    }
                }
                
                // Prune data lebih dari 7 hari setiap 1 jam untuk mencegah DB bengkak
                if (time() - $lastPrune > 3600) {
                    \App\Models\SensorLog::where('created_at', '<', now()->subDays(7))->delete();
                    $lastPrune = time();
                    $this->info("🧹 Pruned logs older than 7 days.");
                }
                
                sleep(1);
            }
        } else {
            // Cuma 1 broker, jalankan langsung di proses ini
            foreach ($brokerGroups as $fingerprint => $group) {
                $this->runBrokerListener($fingerprint, $group['config'], $group['sectors']);
            }
        }
    }

    /**
     * Jalankan koneksi + subscribe loop untuk satu broker.
     * Reconnect otomatis jika koneksi putus.
     */
    private function runBrokerListener(string $fingerprint, array $config, array $sectors)
    {
        $clientId = 'laravel_sf_' . md5($fingerprint) . '_' . uniqid();

        $connectionSettings = (new ConnectionSettings)
            ->setUsername($config['username'])
            ->setPassword($config['password'])
            ->setKeepAliveInterval(60)
            ->setConnectTimeout(5)
            ->setUseTls($config['tls']);

        while (true) {
            try {
                $this->info("🔌 Connecting to {$fingerprint}...");
                $mqtt = new MqttClient($config['host'], $config['port'], $clientId);
                $mqtt->connect($connectionSettings, false);
                $this->info("✅ Connected to {$fingerprint}");

                // Subscribe semua topic yang dikonfigurasi di sektor ini
                foreach ($sectors as $sector) {
                    $topic = $sector->mqtt_topic_pattern;
                    $this->info("   ↳ Subscribing [{$sector->name}] → {$topic}");

                    $mqtt->subscribe($topic, function (string $incomingTopic, string $message) use ($sectors, $fingerprint) {
                        $this->info(sprintf('📥 [%s] %s: %s', $fingerprint, $incomingTopic, substr($message, 0, 100)));
                        $this->routeMessage($incomingTopic, $message, $sectors);
                    }, 0);
                }

                $mqtt->loop(true);
                $mqtt->disconnect();

            } catch (Exception $e) {
                $this->error("❌ MQTT Error [{$fingerprint}]: " . $e->getMessage());
                $this->info('🔄 Reconnecting in 5 seconds...');
                sleep(5);
            }
        }
    }

    /**
     * Route pesan masuk ke sektor yang tepat berdasarkan topic pattern matching.
     *
     * @param string  $incomingTopic Topic aktual yang diterima, misal "smartcoop/sensor/temp"
     * @param string  $message       Payload pesan
     * @param Sector[] $sectors      Daftar sektor yang dimonitor oleh broker ini
     */
    private function routeMessage(string $incomingTopic, string $message, array $sectors)
    {
        foreach ($sectors as $sector) {
            if ($this->topicMatches($sector->mqtt_topic_pattern, $incomingTopic)) {
                $this->processSectorMessage($sector, $incomingTopic, $message);
                return;
            }
        }

        $this->warn("⚠️  Topic tidak dikenali oleh sektor manapun: {$incomingTopic}");
    }

    /**
     * Proses pesan untuk satu sektor.
     * Mendukung dua format payload:
     *   - JSON (untuk sektor hidroponik, dll): {"temperature": 28, "humidity": 65}
     *   - Scalar string (untuk smartcoop): satu nilai per topic, misal "28.5"
     */
    private function processSectorMessage(Sector $sector, string $topic, string $message)
    {
        try {
            $metricMap = $sector->mqtt_metric_map; // null jika tidak dikonfigurasi

            // ── Deteksi format payload ──────────────────────────────────────
            $payload = json_decode($message, true);

            if (is_array($payload)) {
                // Format JSON — satu pesan berisi banyak metric
                $this->processJsonPayload($sector, $payload);
            } else {
                // Format scalar — satu pesan, satu metric, topic menentukan tipe
                $topicParts = explode('/', $topic);
                $topicSuffix = end($topicParts); // suffix terakhir = nama metric

                // Cari nama field DB: cek metric map dulu, fallback ke suffix langsung
                $fieldName = $metricMap[$topicSuffix] ?? $topicSuffix;

                $this->processScalarPayload($sector, $fieldName, $message);
            }

        } catch (Exception $e) {
            $this->error("❌ Gagal memproses pesan untuk sektor {$sector->sector_id}: " . $e->getMessage());
        }
    }

    /**
     * Proses payload JSON (multi-metric dalam satu pesan).
     * Dipakai oleh sektor hidroponik dan sejenisnya.
     */
    private function processJsonPayload(Sector $sector, array $payload)
    {
        $validTypes = self::DEFAULT_VALID_TYPES;

        // Jika sektor punya metric map sendiri, expand valid types dari map values
        if ($sector->mqtt_metric_map) {
            $validTypes = array_merge($validTypes, array_values($sector->mqtt_metric_map));
        }

        $metrics = is_string($sector->metrics) ? json_decode($sector->metrics, true) : ($sector->metrics ?? []);

        foreach ($payload as $key => $value) {
            // Normalisasi key (snake_case → camelCase)
            $normalizedKey = match($key) {
                'water_level'  => 'waterLevel',
                'light_level'  => 'lightLevel',
                'pump_status'  => 'pumpStatus',
                default        => $sector->mqtt_metric_map[$key] ?? $key,
            };

            $logValue = $this->normalizeValue($value);

            if (is_numeric($logValue) && !in_array($normalizedKey, self::NON_LOG_TYPES)) {
                SensorLog::create([
                    'sector_id' => $sector->sector_id,
                    'type'      => $normalizedKey,
                    'value'     => (float) $logValue,
                ]);
                $this->checkAlerts($sector->sector_id, $normalizedKey, (float) $logValue);
            }

            $metrics[$normalizedKey] = $logValue;

            // Hapus key lama (snake_case) jika ada
            if ($normalizedKey !== $key && isset($metrics[$key])) {
                unset($metrics[$key]);
            }
        }

        $sector->metrics = $metrics;
        $sector->save();
        $this->info("✅ JSON payload saved → sector {$sector->sector_id}");
    }

    /**
     * Proses payload scalar (satu nilai, satu topic).
     * Dipakai oleh sektor kandang ayam (smartcoop/#) dan format sejenis.
     */
    private function processScalarPayload(Sector $sector, string $fieldName, string $rawValue)
    {
        $logValue = $this->normalizeValue($rawValue);

        if (is_numeric($logValue) && !in_array($fieldName, self::NON_LOG_TYPES)) {
            SensorLog::create([
                'sector_id' => $sector->sector_id,
                'type'      => $fieldName,
                'value'     => (float) $logValue,
            ]);
            $this->checkAlerts($sector->sector_id, $fieldName, (float) $logValue);
        }

        $metrics = is_string($sector->metrics) ? json_decode($sector->metrics, true) : ($sector->metrics ?? []);
        $metrics[$fieldName] = $logValue;
        $sector->metrics = $metrics;
        $sector->save();

        $this->info("✅ Scalar saved → {$sector->sector_id}.{$fieldName} = {$logValue}");
    }

    /**
     * Normalisasi nilai: ON→1, OFF→0, TRUE→1, FALSE→0, string lain tetap.
     */
    private function normalizeValue(mixed $value): mixed
    {
        $upper = strtoupper((string) $value);
        if ($upper === 'ON'  || $upper === 'TRUE')  return 1;
        if ($upper === 'OFF' || $upper === 'FALSE') return 0;
        return $value;
    }

    /**
     * Cocokkan topic MQTT dengan pattern (mendukung wildcard # dan +).
     *
     * Contoh:
     *   topicMatches('smartcoop/#', 'smartcoop/sensor/temp') → true
     *   topicMatches('smartfarming/+/sensor/+', 'smartfarming/hydro/sensor/sec-010') → true
     */
    private function topicMatches(string $pattern, string $topic): bool
    {
        // Escape karakter regex, lalu ganti wildcard MQTT
        $regex = preg_quote($pattern, '/');
        $regex = str_replace('\#', '.*', $regex);  // # = multi-level wildcard
        $regex = str_replace('\+', '[^/]+', $regex); // + = single-level wildcard
        return (bool) preg_match('#^' . $regex . '$#', $topic);
    }

    /**
     * Cek ambang batas dan kirim notifikasi jika perlu.
     * Notifikasi tidak dikirim jika sudah ada notifikasi serupa dalam 30 menit terakhir.
     */
    private function checkAlerts(string $sectorId, string $type, float $value)
    {
        $title   = null;
        $message = null;
        $notifType = 'alert';

        if ($type === 'temperature' && $value > 35) {
            $title     = 'Suhu Kritis';
            $message   = "Suhu di sektor {$sectorId} mencapai {$value}°C. Harap segera periksa pendingin/kipas.";
            $notifType = 'alert';
        } elseif ($type === 'temperature' && $value > 0 && $value < 20) {
            $title     = 'Suhu Terlalu Dingin';
            $message   = "Suhu di sektor {$sectorId} turun menjadi {$value}°C. Harap periksa pemanas.";
            $notifType = 'warning';
        } elseif ($type === 'waterLevel' && $value > 0 && $value < 20) {
            $title     = 'Air Habis';
            $message   = "Level air di sektor {$sectorId} tersisa {$value}%. Segera isi tangki.";
            $notifType = 'warning';
        } elseif ($type === 'ammonia' && $value > 200) {
            $title     = 'Amonia Tinggi';
            $message   = "Kadar amonia di sektor {$sectorId} terlalu tinggi ({$value}). Kualitas udara memburuk.";
            $notifType = 'alert';
        } elseif ($type === 'feedLevel' && $value > 0 && $value < 20) {
            $title     = 'Pakan Hampir Habis';
            $message   = "Sisa pakan di sektor {$sectorId} tersisa {$value}%. Segera isi ulang wadah pakan.";
            $notifType = 'warning';
        }

        if ($title) {
            $recent = \App\Models\Notification::where('title', $title)
                ->where('created_at', '>=', now()->subMinutes(30))
                ->first();

            if (!$recent) {
                \App\Models\Notification::create([
                    'title'   => $title,
                    'message' => $message,
                    'type'    => $notifType,
                    'is_read' => false,
                ]);
                $this->info("🔔 Alert sent: {$title}");
            }
        }
    }
}
