<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
}
