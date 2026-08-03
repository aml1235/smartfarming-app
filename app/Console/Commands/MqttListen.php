<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;
use App\Models\SensorLog;
use App\Models\Sector;
use Exception;

class MqttListen extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mqtt:listen {--broker=default : Which broker to connect to (default, coop)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Listen to MQTT Broker for Sensor Data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        date_default_timezone_set('Asia/Jakarta');
        config(['app.timezone' => 'Asia/Jakarta']);
        
        $brokerType = $this->option('broker');
        $prefix = $brokerType === 'coop' ? 'MQTT_COOP_' : 'MQTT_';

        $server   = env($prefix . 'HOST', env('MQTT_HOST', 'broker.hivemq.com'));
        $port     = env($prefix . 'PORT', env('MQTT_PORT', 1883));
        $clientId = env($prefix . 'CLIENT_ID', 'laravel_backend_' . uniqid());
        $username = env($prefix . 'USERNAME');
        $password = env($prefix . 'PASSWORD');
        
        $clean_session = true;

        $connectionSettings = (new ConnectionSettings)
            ->setUsername($username)
            ->setPassword($password)
            ->setKeepAliveInterval(60)
            ->setConnectTimeout(3)
            ->setUseTls(env($prefix . 'TLS', env('MQTT_TLS', false)));

        $mqtt = new MqttClient($server, $port, $clientId);

        try {
            $this->info("Connecting to MQTT Broker at {$server}:{$port}...");
            $mqtt->connect($connectionSettings, $clean_session);
            $this->info("Connected successfully!");

            $this->info("Subscribing to smartfarming and smartcoop topics...");

            $mqtt->subscribe('smartfarming/+/sensor/+', function (string $topic, string $message) {
                $this->info(sprintf("Received message on topic [%s]: %s", $topic, $message));
                
                // Topik format: smartfarming/{tipe}/sensor/{sector_id}
                $topicParts = explode('/', $topic);
                $sectorId = end($topicParts);
                
                $this->processSensorData($sectorId, $message);
            }, 0);

            // Subscribe untuk Kandang Ayam (smartcoop/#)
            $mqtt->subscribe('smartcoop/#', function (string $topic, string $message) {
                $this->info(sprintf("Received smartcoop message [%s]: %s", $topic, $message));
                $this->processSmartcoopData($topic, $message);
            }, 0);

            $mqtt->loop(true);
            $mqtt->disconnect();
        } catch (Exception $e) {
            $this->error('MQTT Error: ' . $e->getMessage());
        }
    }

    private function processSmartcoopData($topic, $message)
    {
        try {
            // Find Kandang Ayam sector
            $sector = Sector::where('name', 'ILIKE', '%kandang%')
                ->orWhere('sector_id', 'LIKE', '%kandang%')
                ->orWhere('name', 'ILIKE', '%sec-011%')
                ->orWhere('sector_id', 'LIKE', '%sec-011%')
                ->first();
            if (!$sector) {
                $this->error("Sector Kandang Ayam not found di Database.");
                return;
            }

            $topicParts = explode('/', $topic);
            $metricType = end($topicParts); // e.g. temp, humidity, waterlevel, dll

            // Map MQTT topic ke tipe metrics di DB
            $metricMap = [
                'temp' => 'temperature',
                'humidity' => 'humidity',
                'mq135' => 'ammonia',
                'waterlevel' => 'waterLevel',
                'lamp' => 'lampStatus',
                'conveyor' => 'conveyorStatus',
                'pompa' => 'pumpStatus',
                'lampauto' => 'lampAutoMode',
                'time' => 'lastSync',
                'system' => 'systemStatus',
            ];

            $type = $metricMap[$metricType] ?? $metricType;
            
            $logValue = $message;
            if (strtoupper((string)$message) === 'ON') $logValue = 1;
            if (strtoupper((string)$message) === 'OFF') $logValue = 0;
            if (strtoupper((string)$message) === 'TRUE') $logValue = 1;
            if (strtoupper((string)$message) === 'FALSE') $logValue = 0;

            // Simpan ke log jika datanya berupa angka (sensor)
            if (is_numeric($logValue) && !in_array($type, ['lastSync', 'systemStatus'])) {
                SensorLog::create([
                    'sector_id' => $sector->sector_id,
                    'type' => $type,
                    'value' => (float) $logValue
                ]);
            }

            // Update state metrics di sektor
            $metrics = is_string($sector->metrics) ? json_decode($sector->metrics, true) : ($sector->metrics ?? []);
            $metrics[$type] = $logValue;
            $sector->metrics = $metrics;
            $sector->save();
            $this->info("✅ Data saved for smartcoop metric {$type} (Sector: {$sector->sector_id})");

        } catch (\Exception $e) {
            $this->error("❌ Gagal menyimpan ke Database smartcoop: " . $e->getMessage());
        }
    }

    private function processSensorData($sectorId, $message)
    {
        try {
            $payload = json_decode($message, true);
            if (!$payload) {
                $this->error("Invalid JSON payload.");
                return;
            }

            $sector = Sector::where('sector_id', $sectorId)->first();
            if (!$sector) {
                $this->error("Sector {$sectorId} not found di Database Lokal. Pastikan database Anda hidup dan ID-nya cocok.");
                return;
            }

            $metrics = is_string($sector->metrics) ? json_decode($sector->metrics, true) : ($sector->metrics ?? []);
            $validTypes = ['temperature', 'humidity', 'waterLevel', 'lightLevel', 'water_level', 'light_level', 'pumpStatus', 'pump_status', 'lampStatus', 'exhaustStatus', 'motorStatus', 'lampAutoMode'];

            foreach ($payload as $key => $value) {
                if (in_array($key, $validTypes)) {
                    $logValue = $value;
                    if (strtoupper((string)$value) === 'ON') $logValue = 1;
                    if (strtoupper((string)$value) === 'OFF') $logValue = 0;

                    if (is_numeric($logValue)) {
                        SensorLog::create([
                            'sector_id' => $sectorId,
                            'type' => $key,
                            'value' => (float) $logValue
                        ]);
                    }
                    $metrics[$key] = $logValue;
                }
            }

            $sector->metrics = $metrics;
            $sector->save();
            $this->info("✅ Data saved for sector {$sectorId}");
        } catch (\Exception $e) {
            $this->error("❌ Gagal menyimpan ke Database: " . $e->getMessage());
        }
    }
}
