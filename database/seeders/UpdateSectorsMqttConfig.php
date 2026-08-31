<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * UpdateSectorsMqttConfig
 *
 * Mengisi kolom MQTT config di tabel sectors untuk sektor yang sudah ada.
 * Jalankan dengan: php artisan db:seed --class=UpdateSectorsMqttConfig
 *
 * CATATAN: Sektor baru di masa depan bisa diisi langsung melalui UI (AddSectorModal)
 * tanpa perlu mengubah seeder ini sama sekali.
 */
class UpdateSectorsMqttConfig extends Seeder
{
    public function run(): void
    {
        // -------------------------------------------------------
        // SEKTOR HIDROPONIK (SEC-010)
        // Broker: utama (dari .env MQTT_HOST)
        // Topic : smartfarming/+/sensor/SEC-010 (disubscribe via wildcard)
        // -------------------------------------------------------
        DB::table('sectors')
            ->where('sector_id', 'SEC-010')
            ->update([
                'mqtt_topic_pattern' => 'smartfarming/+/sensor/+',
                'mqtt_broker_config' => null, // pakai broker utama dari .env
                'mqtt_metric_map'    => null, // pakai validTypes standar
                'mqtt_control_topic' => 'smartfarming/hydroponic/cmd',
            ]);

        $this->command->info('✅ SEC-010 (Hidroponik): MQTT config updated (broker utama)');

        // -------------------------------------------------------
        // SEKTOR KANDANG AYAM (sec-011)
        // Broker: broker rekan (HiveMQ Cloud berbeda)
        // Topic : smartcoop/#
        // Metric map: mapping lengkap dari topic-suffix ke field DB
        // -------------------------------------------------------
        DB::table('sectors')
            ->where('sector_id', 'sec-011')
            ->update([
                'mqtt_topic_pattern' => 'smartcoop/#',
                'mqtt_broker_config' => json_encode([
                    'host'     => '7953ca21897d4be78141b6206bf9c205.s1.eu.hivemq.cloud',
                    'port'     => 8883,
                    'tls'      => true,
                    'username' => 'rendi',
                    'password' => '12345678',
                ]),
                'mqtt_metric_map' => json_encode([
                    // --- Sensor utama ---
                    'temp'            => 'temperature',
                    'humidity'        => 'humidity',
                    'mq135'           => 'ammonia',
                    'mq135volt'       => 'mq135Voltage',
                    'wateradc'        => 'waterAdc',
                    'watervoltage'    => 'waterVoltage',
                    'waterlevel'      => 'waterLevel',
                    // --- Status aktuator ---
                    'lamp'            => 'lampStatus',
                    'conveyor'        => 'conveyorStatus',
                    'conveyorphase'   => 'conveyorPhase',
                    'pompa'           => 'pumpStatus',
                    'lampauto'        => 'lampAutoMode',
                    'pompaauto'       => 'pompaAutoMode',
                    'time'            => 'lastSync',
                    'system'          => 'systemStatus',
                    // --- Jadwal ---
                    'lampon'          => 'lampOn',
                    'lampoff'         => 'lampOff',
                    'conveyoron'      => 'cv1On',
                    'conveyor2on'     => 'cv2On',
                    'conveyor2en'     => 'cv2En',
                    'convrun'         => 'convRun',
                    'convpause'       => 'convPause',
                    'convspeed'       => 'convSpeed',
                    // --- Feeder ---
                    'feeddistance'    => 'feedDistance',
                    'feedlevel'       => 'feedLevel',
                    'feeder'          => 'feederStatus',
                    'lastfeed'        => 'lastFeed',
                    'feedersystem'    => 'feederSystemStatus',
                    'feedtime1'       => 'feedTime1',
                    'feedtime2'       => 'feedTime2',
                    'feedtime2en'     => 'feedTime2En',
                    'feedduration'    => 'feedDuration',
                    'feedangleopen'   => 'feedAngleOpen',
                    'feedangleclose'  => 'feedAngleClose',
                    'feedangleopen2'  => 'feedAngleOpen2',
                    'feedangleclose2' => 'feedAngleClose2',
                    'feeddistfull'    => 'feedDistFull',
                    'feeddistempty'   => 'feedDistEmpty',
                ]),
                'mqtt_control_topic' => 'smartcoop/control',
            ]);

        $this->command->info('✅ sec01 (Kandang Ayam): MQTT config updated (broker kustom)');

        $this->command->line('');
        $this->command->info('🎉 Seeder selesai! Sektor baru dapat ditambah melalui UI tanpa mengubah code.');
    }
}
