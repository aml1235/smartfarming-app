<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Hapus semua data dummy:
     * - Sektor kolam & irigasi
     * - Semua aktivitas lama
     * - Semua notifikasi lama
     */
    public function up(): void
    {
        // 1. Hapus sektor yang tidak dipakai
        DB::table('sectors')->whereIn('sector_id', ['kolam', 'irigasi'])->delete();

        // 2. Kosongkan tabel activities (data dummy)
        DB::table('activities')->truncate();

        // 3. Kosongkan tabel notifications (data dummy)
        DB::table('notifications')->truncate();
    }

    public function down(): void
    {
        // Tidak di-rollback karena data dummy tidak perlu dikembalikan
    }
};
