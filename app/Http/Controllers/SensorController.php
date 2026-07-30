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
            'sectorId' => 'eq.' . $sectorId,
            'order' => 'created_at.desc', // Asumsi ada kolom created_at
            'limit' => 1
        ]);

        if ($response->successful()) {
            $data = $response->json();
            if (is_array($data) && count($data) > 0) {
                return response()->json($data[0]);
            }
            return response()->json(['message' => 'No data found'], 404);
        }

        return response()->json(['error' => 'Failed to fetch from Supabase'], 500);
    }
}
