<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sector extends Model
{
    protected $fillable = [
        'sector_id',
        'name',
        'unit',
        'status',
        'metrics',
        'mqtt_topic_pattern',
        'mqtt_broker_config',
        'mqtt_metric_map',
        'mqtt_control_topic',
    ];

    protected $casts = [
        'metrics'            => 'array',
        'mqtt_broker_config' => 'array',
        'mqtt_metric_map'    => 'array',
    ];

    /**
     * Ambil konfigurasi koneksi MQTT untuk sektor ini.
     * Jika mqtt_broker_config null, kembalikan config dari .env (broker utama).
     */
    public function getMqttConnectionConfig(): array
    {
        if (!empty($this->mqtt_broker_config)) {
            return [
                'host'     => $this->mqtt_broker_config['host']     ?? env('MQTT_HOST'),
                'port'     => $this->mqtt_broker_config['port']     ?? (int) env('MQTT_PORT', 8883),
                'tls'      => $this->mqtt_broker_config['tls']      ?? (bool) env('MQTT_TLS', false),
                'username' => $this->mqtt_broker_config['username'] ?? env('MQTT_USERNAME'),
                'password' => $this->mqtt_broker_config['password'] ?? env('MQTT_PASSWORD'),
            ];
        }

        // Default: broker utama dari .env
        return [
            'host'     => env('MQTT_HOST', 'broker.hivemq.com'),
            'port'     => (int) env('MQTT_PORT', 1883),
            'tls'      => (bool) env('MQTT_TLS', false),
            'username' => env('MQTT_USERNAME'),
            'password' => env('MQTT_PASSWORD'),
        ];
    }

    /**
     * Buat fingerprint unik dari config broker untuk grouping.
     * Sektor dengan broker yang sama akan digroup ke 1 koneksi MQTT.
     */
    public function getBrokerFingerprint(): string
    {
        $cfg = $this->getMqttConnectionConfig();
        return $cfg['host'] . ':' . $cfg['port'];
    }
}
