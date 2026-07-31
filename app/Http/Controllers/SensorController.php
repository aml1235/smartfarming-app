<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\SensorLog;
use App\Models\Sector;

class SensorController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sector_id' => 'required|string',
            'type' => 'required|string',
            'value' => 'required|numeric'
        ]);

        // 1. Simpan ke sensor_logs
        $log = SensorLog::create($validated);

        // 2. Update metrics di tabel sectors
        $sector = Sector::where('id', $validated['sector_id'])->first();
        if ($sector) {
            $metrics = $sector->metrics ?? [];
            $metrics[$validated['type']] = $validated['value'];
            $sector->metrics = $metrics;
            $sector->save();
        }

        return response()->json(['message' => 'Data sensor berhasil disimpan', 'data' => $log], 201);
    }

    public function getSupabaseData($sectorId)
    {
        $url = config('services.supabase.url') . '/rest/v1/sensor_data';
        $key = config('services.supabase.key');

        $response = Http::withHeaders([
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key
        ])->get($url, [
            'sector_id' => 'eq.' . $sectorId, // Sesuai dengan kolom di Supabase
            'order' => 'created_at.desc',
            'limit' => 1
        ]);

        if ($response->successful()) {
            $data = $response->json();
            if (is_array($data) && count($data) > 0) {
                $latestData = $data[0];

                // 1. Simpan ke sensor_logs
                $sensorTypes = ['temperature', 'humidity', 'water_level', 'light_level'];
                foreach ($sensorTypes as $type) {
                    if (isset($latestData[$type]) && is_numeric($latestData[$type])) {
                        SensorLog::create([
                            'sector_id' => $sectorId,
                            'type' => $type,
                            'value' => (float) $latestData[$type]
                        ]);
                    }
                }

                // 2. Update metrics di tabel sectors
                $sector = Sector::where('id', $sectorId)->first();
                if ($sector) {
                    $metrics = $sector->metrics ?? [];
                    // Simpan seluruh data ke metrics termasuk pump_status
                    foreach (['temperature', 'humidity', 'water_level', 'light_level', 'pump_status'] as $keyName) {
                        if (isset($latestData[$keyName])) {
                            $metrics[$keyName] = $latestData[$keyName];
                        }
                    }
                    $sector->metrics = $metrics;
                    $sector->save();
                }

                return response()->json([
                    'message' => 'Data berhasil ditarik dan disimpan', 
                    'data' => $latestData
                ]);
            }
            return response()->json(['message' => 'No data found'], 404);
        }

        return response()->json(['error' => 'Failed to fetch from Supabase'], 500);
    }
}
