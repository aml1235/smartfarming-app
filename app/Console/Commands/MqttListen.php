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
    protected $signature = 'mqtt:listen';

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
        $server   = env('MQTT_HOST', 'broker.hivemq.com');
        $port     = env('MQTT_PORT', 1883);
        $clientId = env('MQTT_CLIENT_ID', 'laravel_backend_' . uniqid());
        $username = env('MQTT_USERNAME');
        $password = env('MQTT_PASSWORD');
        
        $clean_session = true;

        $connectionSettings = (new ConnectionSettings)
            ->setUsername($username)
            ->setPassword($password)
            ->setKeepAliveInterval(60)
            ->setConnectTimeout(3)
            ->setUseTls(env('MQTT_TLS', false));

        $mqtt = new MqttClient($server, $port, $clientId);

        try {
            $this->info("Connecting to MQTT Broker at {$server}:{$port}...");
            $mqtt->connect($connectionSettings, $clean_session);
            $this->info("Connected successfully!");

            // Subscribe menggunakan wildcard '+' untuk menangkap data dari semua sektor (hydroponic & poultry)
            $topic = 'smartfarming/+/sensor/+';
            $this->info("Subscribing to topic: {$topic}");

            $mqtt->subscribe($topic, function (string $topic, string $message) {
                $this->info(sprintf("Received message on topic [%s]: %s", $topic, $message));
                
                // Topik format: smartfarming/{tipe}/sensor/{sector_id}
                $topicParts = explode('/', $topic);
                $sectorId = end($topicParts);
                
                $this->processSensorData($sectorId, $message);
            }, 0);

            $mqtt->loop(true);
            $mqtt->disconnect();
        } catch (Exception $e) {
            $this->error('MQTT Error: ' . $e->getMessage());
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

            $metrics = $sector->metrics ?? [];
            $validTypes = ['temperature', 'humidity', 'waterLevel', 'lightLevel', 'water_level', 'light_level', 'pumpStatus', 'pump_status'];

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
