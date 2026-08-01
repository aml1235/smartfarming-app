<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Using sqlite memory for test
config(['database.default' => 'sqlite']);
config(['database.connections.sqlite.database' => ':memory:']);
\Illuminate\Support\Facades\Artisan::call('migrate');
\Illuminate\Support\Facades\Artisan::call('db:seed');

$request = new \Illuminate\Http\Request();
$request->merge(['sector_id' => 'SEC-010', 'temperature' => 28.5, 'humidity' => 60.5, 'light_level' => 80, 'water_level' => 15.5, 'pump_status' => 'ON']);
$controller = new \App\Http\Controllers\SensorController();
try {
    echo $controller->store($request)->getContent();
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
