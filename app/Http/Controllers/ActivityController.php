<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;

/**
 * ActivityController
 *
 * Menyajikan log aktivitas pengguna untuk keperluan audit trail.
 * Seluruh pengguna yang sudah login dapat membaca riwayat aktivitas;
 * pembatasan lebih lanjut (mis. hanya milik diri sendiri) dapat
 * ditambahkan di method index() jika diperlukan.
 */
class ActivityController extends Controller
{
    /**
     * Mengembalikan 50 entri aktivitas terbaru secara descending.
     * Query parameter opsional:
     *   ?limit=N   — jumlah entri (maks 200, default 50)
     *   ?user_id=X — filter berdasarkan ID pengguna tertentu (admin saja)
     */
    public function index(Request $request)
    {
        $limit = min((int) $request->query('limit', 50), 200);

        $query = Activity::orderBy('created_at', 'desc');

        // Admin dapat memfilter per-pengguna
        if ($request->has('user_id') && $request->user()->role === 'admin') {
            $query->where('user_id', $request->query('user_id'));
        }

        return response()->json($query->take($limit)->get());
    }
}
