<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['user_id', 'user_name', 'action', 'target'];

    /**
     * Catat aktivitas secara seragam.
     * Menyimpan user_id (untuk relasi) dan user_name (untuk tampilan).
     */
    public static function record(?User $user, string $action, string $target): void
    {
        static::create([
            'user_id'   => $user?->id,
            'user_name' => $user?->name ?? 'Sistem',
            'action'    => $action,
            'target'    => $target,
        ]);
    }
}
