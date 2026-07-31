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
        $payload = $request->all();
        $sectorId = $payload['sector_id'] ?? 'SEC-010'; // Default jika tidak dikirim
        $sector = Sector::where('id', $sectorId)->first();
        
        $metrics = $sector ? ($sector->metrics ?? []) : [];
        $savedLogs = [];

        // Jika format adalah { type: '...', value: ... }
        if (isset($payload['type']) && isset($payload['value'])) {
            $log = SensorLog::create([
                'sector_id' => $sectorId,
                'type' => $payload['type'],
                'value' => $payload['value']
            ]);
            $metrics[$payload['type']] = $payload['value'];
            $savedLogs[] = $log;
        } else {
            // Jika format adalah { temperature: 28.5, waterLevel: 80, ... }
            $validTypes = ['temperature', 'humidity', 'waterLevel', 'lightLevel', 'water_level', 'light_level', 'pumpStatus', 'pump_status'];
            foreach ($payload as $key => $value) {
                if (in_array($key, $validTypes)) {
                    // Simpan history hanya untuk numerik
                    if (is_numeric($value)) {
                        $savedLogs[] = SensorLog::create([
                            'sector_id' => $sectorId,
                            'type' => $key,
                            'value' => (float) $value
                        ]);
                    }
                    $metrics[$key] = $value;
                }
            }
        }

        if ($sector) {
            $sector->metrics = $metrics;
            $sector->save();
        }

        return response()->json(['message' => 'Data sensor berhasil disimpan', 'data' => $savedLogs], 201);
    }

    public function getSupabaseData($sectorId)
    {
        $url = config('services.supabase.url');
        $key = config('services.supabase.key');

        if (!$url || !$key) {
            return response()->json(['message' => 'Supabase not configured on server'], 404);
        }

        $url = $url . '/rest/v1/sensor_data';

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
                $sector = Sector::where('sector_id', $sectorId)->first();
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
