<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Notification::latest();

        // Operator hanya melihat notifikasi dari sektor yang ditugaskan
        if ($user->role !== 'admin') {
            $query->whereIn('sector_id', $user->assigned_sectors ?? []);
        }

        return response()->json($query->limit(50)->get());
    }

    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        $notification = Notification::find($id);

        if ($notification) {
            // Pastikan operator hanya bisa menandai notifikasi sektornya
            if ($user->role !== 'admin') {
                abort_unless(
                    in_array($notification->sector_id, $user->assigned_sectors ?? [], true),
                    403,
                    'Anda tidak memiliki akses ke notifikasi ini.'
                );
            }

            $notification->is_read = true;
            $notification->save();
        }

        return response()->json(['message' => 'Telah dibaca']);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        $query = Notification::where('is_read', false);

        // Operator hanya menandai notifikasi dari sektornya
        if ($user->role !== 'admin') {
            $query->whereIn('sector_id', $user->assigned_sectors ?? []);
        }

        $query->update(['is_read' => true]);

        return response()->json(['message' => 'Semua ditandai telah dibaca']);
    }
}
