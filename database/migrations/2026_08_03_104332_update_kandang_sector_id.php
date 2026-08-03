<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('sectors')->where('sector_id', 'kandang')->update(['sector_id' => 'SEC-011']);
        DB::table('sensor_logs')->where('sector_id', 'kandang')->update(['sector_id' => 'SEC-011']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('sectors')->where('sector_id', 'SEC-011')->update(['sector_id' => 'kandang']);
        DB::table('sensor_logs')->where('sector_id', 'SEC-011')->update(['sector_id' => 'kandang']);
    }
};
