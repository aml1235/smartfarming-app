<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Hanya membuat 1 akun Admin Utama default untuk akses awal.
     * User dan Sektor lainnya dapat ditambahkan langsung melalui Web UI.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name'     => 'Admin Utama',
                'password' => bcrypt('password'),
                'role'     => 'admin',
            ]
        );
    }
}
