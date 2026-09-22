<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Lama Penyimpanan Data Sensor (hari)
    |--------------------------------------------------------------------------
    |
    | Berapa hari data log sensor dan notifikasi disimpan sebelum dihapus
    | secara otomatis oleh perintah sensor:cleanup (dijalankan terjadwal).
    |
    | Atur SENSOR_LOG_RETENTION_DAYS di environment Railway untuk mengubah
    | nilainya tanpa menyentuh kode. Pertimbangkan kapasitas Supabase
    | (paket gratis ±500 MB) sebelum menaikkan angka ini.
    |
    */
    'retention_days' => env('SENSOR_LOG_RETENTION_DAYS', 30),
];
