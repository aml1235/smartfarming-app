<?php
require 'vendor/autoload.php';
$client = new \PhpMqtt\Client\MqttClient('e8d98b46c66448469bd969da39a11bd8.s1.eu.hivemq.cloud', 8883, 'test_client_id');
$settings = (new \PhpMqtt\Client\ConnectionSettings)->setUsername('amel')->setPassword('amelpw123')->setUseTls(true);
try {
    $client->connect($settings, true);
    $client->subscribe('smartfarming/+/sensor/+', function ($topic, $message) {
        echo "Received on $topic: $message\n";
    }, 0);
    $client->loop(true);
    echo 'Success!';
} catch (\Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
