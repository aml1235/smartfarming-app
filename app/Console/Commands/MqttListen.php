<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;
use App\Models\SensorLog;
use App\Models\Sector;
use Illuminate\Support\Facades\Cache;
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

    // Ambang batas default (digunakan jika sektor tidak punya alert_thresholds sendiri)
    private const DEFAULT_ALERT_THRESHOLDS = [
        'temperature_high' => 35,
        'temperature_low'  => 20,
        'waterLevel_low'   => 20,
        'ammonia_high'     => 200,
        'feedLevel_low'    => 20,
    ];

    // Seberapa sering (detik) memeriksa apakah konfigurasi sektor berubah
    private const SECTOR_RELOAD_INTERVAL = 30;

    /**
     * Sidik jari konfigurasi sektor: berubah jika ada sektor ditambah, diubah, atau dihapus.
     */
    private function sectorFingerprint(): string
    {
        return Sector::count() . '|' . (Sector::max('updated_at') ?? 'none');
    }

    public function handle()
    {
        date_default_timezone_set('Asia/Jakarta');
        config(['app.timezone' => 'Asia/Jakarta']);

        $filterHost = $this->option('broker-host');

        // ── Outer reload loop: restart seluruh konfigurasi saat sektor berubah ──
        while (true) {
            // ── 1. Baca semua sektor yang sudah dikonfigurasi MQTT ──────────────
            $sectors = Sector::whereNotNull('mqtt_topic_pattern')->get();

            if ($sectors->isEmpty()) {
                $this->error('Tidak ada sektor dengan mqtt_topic_pattern di database.');
                $this->info('Tambahkan sektor melalui UI atau jalankan seeder: php artisan db:seed --class=UpdateSectorsMqttConfig');
                $this->info('🔄 Akan mencoba lagi dalam ' . self::SECTOR_RELOAD_INTERVAL . ' detik...');
                sleep(self::SECTOR_RELOAD_INTERVAL);
                continue;
            }

            // ── 2. Group sektor berdasarkan fingerprint broker ──────────────────
            $brokerGroups = [];
            foreach ($sectors as $sector) {
                $fingerprint = $sector->getBrokerFingerprint();

                if ($filterHost && $fingerprint !== $filterHost) {
                    continue;
                }

                $brokerGroups[$fingerprint]['config']    = $sector->getMqttConnectionConfig();
                $brokerGroups[$fingerprint]['sectors'][] = $sector;
            }

            if (empty($brokerGroups)) {
                $this->error("Tidak ada broker yang cocok" . ($filterHost ? " dengan host '{$filterHost}'" : '') . ".");
                sleep(self::SECTOR_RELOAD_INTERVAL);
                continue;
            }

            $this->info('📡 Ditemukan ' . count($brokerGroups) . ' broker grup:');
            foreach ($brokerGroups as $fp => $group) {
                $topicList = collect($group['sectors'])->pluck('mqtt_topic_pattern')->join(', ');
                $this->info("   • {$fp} → [{$topicList}]");
            }

            // ── 3. Multi-broker: spawn worker per broker, monitor + reload ──────
            if (count($brokerGroups) > 1 && !$filterHost) {
                $this->warn('⚠️  Ada lebih dari 1 broker. Mode multi-worker aktif.');
                $this->warn('   Untuk isolasi penuh, jalankan satu process per broker dengan --broker-host=<host>');

                $lastFingerprint = $this->sectorFingerprint();
                $processes = [];

                foreach ($brokerGroups as $fingerprint => $group) {
                    $process = new \Symfony\Component\Process\Process(['php', 'artisan', 'mqtt:listen', '--broker-host=' . $fingerprint]);
                    $process->setTimeout(null);
                    $process->start();
                    $processes[] = $process;
                    $this->info("   ↳ Worker started for {$fingerprint}");
                }

                // Master loop: teruskan output worker + cek perubahan sektor
                $lastCheck = time();
                while (true) {
                    foreach ($processes as $p) {
                        if ($p->isRunning()) {
                            echo $p->getIncrementalOutput();
                            echo $p->getIncrementalErrorOutput();
                        }
                    }

                    // Cek fingerprint setiap SECTOR_RELOAD_INTERVAL detik
                    if (time() - $lastCheck >= self::SECTOR_RELOAD_INTERVAL) {
                        $lastCheck = time();
                        $newFingerprint = $this->sectorFingerprint();

                        if ($newFingerprint !== $lastFingerprint) {
                            $this->info('🔄 Konfigurasi sektor berubah — menghentikan semua worker dan memuat ulang...');
                            foreach ($processes as $p) {
                                $p->stop(3);
                            }
                            break; // keluar dari while(true) master, outer loop akan reload
                        }
                    }
                    sleep(1);
                }

                continue; // outer reload loop — baca sektor lagi dari awal
            }

            // ── 4. Single broker: jalankan langsung di proses ini ───────────────
            foreach ($brokerGroups as $fingerprint => $group) {
                $needsReload = false;
                $this->runBrokerListener($fingerprint, $group['config'], $group['sectors'], $needsReload);

                if ($needsReload) {
                    $this->info('🔄 Memuat ulang konfigurasi sektor...');
                    break; // keluar dari foreach, outer loop akan reload
                }
            }
            // Jika needsReload, outer while(true) akan baca sektor dari awal
        }
    }

    /**
     * Jalankan koneksi + subscribe loop untuk satu broker.
     * Reconnect otomatis jika koneksi putus.
     * Jika $needsReload diset true oleh loop event handler, caller harus reload konfigurasi.
     *
     * @param bool $needsReload Diset true jika fingerprint sektor berubah (by-reference)
     */
    private function runBrokerListener(string $fingerprint, array $config, array $sectors, bool &$needsReload = false)
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

                // ── Detektor perubahan sektor: cek fingerprint tiap 30 detik ──
                $lastFingerprint = $this->sectorFingerprint();
                $lastCheck = time();

                $mqtt->registerLoopEventHandler(
                    function (MqttClient $client) use (&$lastFingerprint, &$lastCheck, &$needsReload) {
                        if (time() - $lastCheck < self::SECTOR_RELOAD_INTERVAL) {
                            return;
                        }
                        $lastCheck = time();

                        $newFingerprint = $this->sectorFingerprint();
                        if ($newFingerprint !== $lastFingerprint) {
                            $this->info('🔄 Konfigurasi sektor berubah, memuat ulang...');
                            $needsReload = true;
                            $client->interrupt(); // hentikan loop secara bersih
                        }
                    }
                );

                $mqtt->loop(true);
                $mqtt->disconnect();

                // Jika loop berhenti karena reload, keluar dari while(true) ini
                if ($needsReload) {
                    return;
                }

            } catch (Exception $e) {
                // Jangan reconnect jika berhenti karena reload
                if ($needsReload) {
                    return;
                }
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
                $this->checkAlerts($sector, $normalizedKey, (float) $logValue);
            }

            $metrics[$normalizedKey] = $logValue;

            // Hapus key lama (snake_case) jika ada
            if ($normalizedKey !== $key && isset($metrics[$key])) {
                unset($metrics[$key]);
            }
        }

        $sector->metrics = $metrics;
        $sector->save();

        // Siarkan paling sering sekali per 2 detik per sektor (hemat kuota Pusher)
        if (Cache::add("broadcast:{$sector->sector_id}", true, 2)) {
            broadcast(new \App\Events\SectorUpdated($sector));
        }

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
            $this->checkAlerts($sector, $fieldName, (float) $logValue);
        }

        $metrics = is_string($sector->metrics) ? json_decode($sector->metrics, true) : ($sector->metrics ?? []);
        $metrics[$fieldName] = $logValue;
        $sector->metrics = $metrics;
        $sector->save();

        // Siarkan paling sering sekali per 2 detik per sektor (hemat kuota Pusher)
        if (Cache::add("broadcast:{$sector->sector_id}", true, 2)) {
            broadcast(new \App\Events\SectorUpdated($sector));
        }

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
     * Ambang batas dibaca dari kolom alert_thresholds sektor, dengan fallback ke default.
     * Notifikasi tidak dikirim jika sudah ada notifikasi serupa dalam 30 menit terakhir
     * untuk sektor yang sama.
     */
    private function checkAlerts(Sector $sector, string $type, float $value)
    {
        $sectorId = $sector->sector_id;

        // Baca ambang batas dari konfigurasi sektor, fallback ke default
        $thresholds = array_merge(self::DEFAULT_ALERT_THRESHOLDS, $sector->alert_thresholds ?? []);

        $title   = null;
        $message = null;
        $notifType = 'alert';

        if ($type === 'temperature' && $value > $thresholds['temperature_high']) {
            $title     = 'Suhu Kritis';
            $message   = "Suhu di sektor {$sectorId} mencapai {$value}°C. Harap segera periksa pendingin/kipas.";
            $notifType = 'alert';
        } elseif ($type === 'temperature' && $value > 0 && $value < $thresholds['temperature_low']) {
            $title     = 'Suhu Terlalu Dingin';
            $message   = "Suhu di sektor {$sectorId} turun menjadi {$value}°C. Harap periksa pemanas.";
            $notifType = 'warning';
        } elseif ($type === 'waterLevel' && $value > 0 && $value < $thresholds['waterLevel_low']) {
            $title     = 'Air Habis';
            $message   = "Level air di sektor {$sectorId} tersisa {$value}%. Segera isi tangki.";
            $notifType = 'warning';
        } elseif ($type === 'ammonia' && $value > $thresholds['ammonia_high']) {
            $title     = 'Amonia Tinggi';
            $message   = "Kadar amonia di sektor {$sectorId} terlalu tinggi ({$value}). Kualitas udara memburuk.";
            $notifType = 'alert';
        } elseif ($type === 'feedLevel' && $value > 0 && $value < $thresholds['feedLevel_low']) {
            $title     = 'Pakan Hampir Habis';
            $message   = "Sisa pakan di sektor {$sectorId} tersisa {$value}%. Segera isi ulang wadah pakan.";
            $notifType = 'warning';
        }

        if ($title) {
            // Cek duplikat per sektor, bukan hanya per judul
            $recent = \App\Models\Notification::where('sector_id', $sectorId)
                ->where('title', $title)
                ->where('created_at', '>=', now()->subMinutes(30))
                ->exists();

            if (!$recent) {
                \App\Models\Notification::create([
                    'sector_id' => $sectorId,
                    'title'     => $title,
                    'message'   => $message,
                    'type'      => $notifType,
                    'is_read'   => false,
                ]);
                $this->info("🔔 Alert sent: {$title}");
            }
        }
    }
}
