# Smart Farming App

Sistem cerdas manajemen sektor peternakan, perikanan, dan pertanian dengan menggunakan IoT dan evaluasi AI.

## Fitur Utama
- **Dashboard Real-time:** Memantau suhu, kelembapan, pakan, pH air, dll.
- **Sistem Kontrol Jarak Jauh:** Menghidupkan/mematikan alat (pompa, lampu, aerator) langsung dari web.
- **Log Aktivitas:** Mencatat setiap perubahan dan kontrol alat oleh pengguna.
- **Sistem Notifikasi:** Memberikan peringatan saat ada parameter sektor yang melampaui batas aman.
- **Evaluasi AI:** Memberikan kesimpulan dan rekomendasi harian berdasarkan data dari sensor IoT.

## Teknologi
- **Frontend:** React + TypeScript + Vite
- **Backend:** Laravel (API)
- **Database:** SQLite (Bawaan)

## Cara Menjalankan di Lokal

### 1. Setup Backend (Laravel)
Pastikan Anda telah menginstal PHP dan Composer.
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```
Backend akan berjalan di `http://127.0.0.1:8000`.

### 2. Setup Frontend (React)
Buka terminal baru, masuk ke folder `frontend`, dan jalankan:
```bash
cd frontend
npm install
npm run dev
```
Frontend akan berjalan di `http://localhost:5173`.

## Catatan Hosting (Railway & Vercel)
- Backend Laravel di-host di Railway dan akan membaca database SQLite secara bawaan.
- Frontend di-host terpisah (misalnya di Vercel) dan perlu disesuaikan URL API-nya jika sudah online.
