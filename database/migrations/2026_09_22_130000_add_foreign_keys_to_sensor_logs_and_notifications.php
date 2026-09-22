<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Hapus dulu data yatim yang sektornya sudah tidak ada,
        // karena foreign key gagal dipasang jika masih ada data tanpa induk
        $sectorIds = DB::table('sectors')->pluck('sector_id');

        DB::table('sensor_logs')
            ->whereNotIn('sector_id', $sectorIds)
            ->delete();

        DB::table('notifications')
            ->whereNotNull('sector_id')
            ->whereNotIn('sector_id', $sectorIds)
            ->delete();

        // Pasang foreign key di sensor_logs
        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->foreign('sector_id')
                  ->references('sector_id')
                  ->on('sectors')
                  ->cascadeOnUpdate()  // ikut berubah kalau sector_id diganti
                  ->cascadeOnDelete(); // ikut terhapus kalau sektor dihapus
        });

        // Pasang foreign key di notifications
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreign('sector_id')
                  ->references('sector_id')
                  ->on('sectors')
                  ->nullOnDelete()    // notifikasi tidak hilang, hanya sector_id jadi null
                  ->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->dropForeign(['sector_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['sector_id']);
        });
    }
};
