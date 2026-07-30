<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Setup Users
        User::create([
            'name' => 'Admin Utama',
            'email' => 'admin@smartfarming.local',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Operator Kandang',
            'email' => 'operator1@smartfarming.local',
            'password' => bcrypt('password'),
            'role' => 'operator',
        ]);

        // 2. Setup Sectors
        $sectors = [
            [
                'sector_id' => 'kandang',
                'name' => 'Kandang Ayam',
                'unit' => 'Peternakan',
                'status' => 'baik',
                'metrics' => ['Suhu' => '28°C', 'Kelembapan' => '65%', 'Populasi Aktif' => '1.240', 'Level Pakan' => '58%', 'Air Minum' => '72%']
            ],
            [
                'sector_id' => 'kolam',
                'name' => 'Kolam Ikan',
                'unit' => 'Akuakultur',
                'status' => 'normal',
                'metrics' => ['pH Air' => '7.2', 'Suhu Air' => '26°C', 'Kekeruhan' => 'Normal', 'Oksigen Terlarut' => '7.8 mg/L', 'Populasi Ikan' => '850', 'Volume Air' => '92%']
            ],
            [
                'sector_id' => 'hidroponik',
                'name' => 'Hidroponik',
                'unit' => 'Tanaman',
                'status' => 'baik',
                'metrics' => ['Level Air' => '85%', 'Suhu Lingkungan' => '27°C']
            ],
            [
                'sector_id' => 'irigasi',
                'name' => 'Irigasi Tanah',
                'unit' => 'Pertanian',
                'status' => 'peringatan',
                'metrics' => ['Kelembapan Tanah' => '45%', 'Status' => 'Kering', 'Lahan Total' => '2.5 Ha', 'Terakhir Irigasi' => '8 jam lalu', 'Volume Air' => '68%', 'Suhu Tanah' => '29°C']
            ]
        ];

        foreach ($sectors as $sector) {
            \App\Models\Sector::create($sector);
        }

        // 3. Setup Activities
        \App\Models\Activity::create([
            'user_name' => 'Admin Utama',
            'action' => 'mengubah konfigurasi',
            'target' => 'Sistem Utama'
        ]);
        
        \App\Models\Activity::create([
            'user_name' => 'Operator Kandang',
            'action' => 'mengaktifkan',
            'target' => 'Pompa Air Minum (Kandang Ayam)'
        ]);
        \App\Models\Notification::create([
            'title' => 'Suhu Ekstrem',
            'message' => 'Suhu di kandang ayam mencapai 32C. Harap segera periksa pendingin.',
            'type' => 'alert'
        ]);

        \App\Models\Notification::create([
            'title' => 'Level Air Rendah',
            'message' => 'Volume air di penampungan utama irigasi berada di bawah batas aman.',
            'type' => 'warning'
        ]);

        \App\Models\Notification::create([
            'title' => 'Laporan Harian',
            'message' => 'Laporan evaluasi semua sektor untuk hari ini sudah tersedia.',
            'type' => 'info'
        ]);
    }
}
