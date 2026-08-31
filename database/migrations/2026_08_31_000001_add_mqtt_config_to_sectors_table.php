<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom MQTT config ke tabel sectors.
     *
     * - mqtt_topic_pattern : MQTT topic yang disubscribe (e.g. "smartcoop/#")
     * - mqtt_broker_config : JSON config broker khusus. NULL = pakai broker utama dari .env
     * - mqtt_metric_map    : JSON mapping topic-suffix ke field DB. NULL = pakai validTypes default
     * - mqtt_control_topic : Base topic untuk publish perintah kontrol dari dashboard
     */
    public function up(): void
    {
        Schema::table('sectors', function (Blueprint $table) {
            $table->string('mqtt_topic_pattern')->nullable()->after('metrics')
                ->comment('MQTT subscribe topic pattern, e.g. smartcoop/# atau smartfarming/+/sensor/sec-010');

            $table->json('mqtt_broker_config')->nullable()->after('mqtt_topic_pattern')
                ->comment('JSON: {host, port, tls, username, password}. NULL = pakai broker utama dari .env');

            $table->json('mqtt_metric_map')->nullable()->after('mqtt_broker_config')
                ->comment('JSON mapping topic-suffix ke field DB. NULL = pakai default validTypes standar');

            $table->string('mqtt_control_topic')->nullable()->after('mqtt_metric_map')
                ->comment('Base topic untuk publish kontrol, e.g. smartcoop/control atau smartfarming/hydroponic/cmd');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sectors', function (Blueprint $table) {
            $table->dropColumn([
                'mqtt_topic_pattern',
                'mqtt_broker_config',
                'mqtt_metric_map',
                'mqtt_control_topic',
            ]);
        });
    }
};
