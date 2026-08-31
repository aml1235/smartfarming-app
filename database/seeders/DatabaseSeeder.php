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
        User::firstOrCreate(
            ['email' => 'admin@smartfarming.local'],
            [
                'name'     => 'Admin Utama',
                'password' => bcrypt('password'),
                'role'     => 'admin',
            ]
        );

        User::firstOrCreate(
            ['email' => 'operator1@smartfarming.local'],
            [
                'name'     => 'Operator Kandang',
                'password' => bcrypt('password'),
                'role'     => 'operator',
            ]
        );

        // 2. Setup Sectors — hanya Kandang Ayam & Hidroponik
        \App\Models\Sector::updateOrCreate(
            ['sector_id' => 'sec01'],
            [
                'name'    => 'Kandang Ayam',
                'unit'    => 'Peternakan',
                'status'  => 'baik',
                'metrics' => [],
            ]
        );

        \App\Models\Sector::updateOrCreate(
            ['sector_id' => 'hidroponik'],
            [
                'name'    => 'Hidroponik',
                'unit'    => 'Tanaman',
                'status'  => 'baik',
                'metrics' => [],
            ]
        );

        // Hapus sektor yang tidak dipakai jika masih ada
        \App\Models\Sector::whereIn('sector_id', ['kolam', 'irigasi', 'SEC-010'])->delete();

        // 3. Tidak ada aktivitas dummy — log akan terisi dari aksi nyata pengguna
    }
}
