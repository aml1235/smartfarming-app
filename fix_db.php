<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$s = App\Models\Sector::where('sector_id', 'sec-03')->first();
$s->mqtt_metric_map = [
    'suhu' => 'temperature',
    'rh' => 'humidity',
    'nh3' => 'ammonia',
    'mq135' => 'ammonia',
    'mq135volt' => 'mq135Voltage',
    'wateradc' => 'waterAdc',
    'watervoltage' => 'waterVoltage',
    'waterlevel' => 'waterLevel',
    'lamp' => 'lampStatus',
    'conveyor' => 'conveyorStatus',
    'conveyorphase' => 'conveyorPhase',
    'pompa' => 'pumpStatus',
    'lampauto' => 'lampAutoMode',
    'pompaauto' => 'pompaAutoMode',
    'time' => 'lastSync',
    'system' => 'systemStatus',
    'lampon' => 'lampOn',
    'lampoff' => 'lampOff',
    'conveyoron' => 'cv1On',
    'conveyor2on' => 'cv2On',
    'conveyor2en' => 'cv2En',
    'convrun' => 'convRun',
    'convpause' => 'convPause',
    'convspeed' => 'convSpeed',
    'feeddistance' => 'feedDistance',
    'feedlevel' => 'feedLevel',
    'feeder' => 'feederStatus',
    'lastfeed' => 'lastFeed',
    'feedersystem' => 'feederSystemStatus'
];
$s->save();
echo "Updated sec-03 mqtt_metric_map!\n";
