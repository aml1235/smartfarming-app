<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Di sini Anda dapat mendaftarkan semua kanal broadcasting yang
| digunakan aplikasi. Otorisasi kanal privat dilakukan di sini
| sehingga hanya pengguna yang berhak yang dapat berlangganan.
|
*/

/**
 * Kanal privat per-sektor: 'sector.{sectorId}'
 *
 * Hanya pengguna yang memiliki akses ke sektor tersebut
 * (admin = semua sektor, operator = hanya sektor yang ditugaskan)
 * yang diizinkan berlangganan.
 *
 * Sesuai dengan User::canAccessSector() di app/Models/User.php.
 */
Broadcast::channel('sector.{sectorId}', function ($user, $sectorId) {
    return $user->canAccessSector($sectorId);
});
