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
        $sector = Sector::where('sector_id', $sectorId)->first();
        
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

}
