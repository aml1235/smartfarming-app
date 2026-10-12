# Smart Farming App

Sistem cerdas manajemen sektor pertanian, peternakan, dan hidroponik terintegrasi berbasis IoT (*Internet of Things*), MQTT, WebSockets (*Pusher*), dan Evaluasi Pakar berbasis AI (*Google Gemini API*).

---

## 🌟 Fitur Utama

- **Dashboard Real-time:** 
  - Monitoring metrik sensor secara langsung (suhu, kelembapan, kadar amonia, level air, tegangan baterai/aki, status konveyor, dll.).
  - Pembaruan metrik *live* menggunakan WebSockets (Pusher) dan MQTT broker.
- **Sistem Kontrol & Penjadwalan Otomatis:**
  - Menghidupkan/mematikan aktuator (lampu, pompa air, feeder/pakan, motor konveyor, dll.) jarak jauh.
  - Penjadwalan timer fleksibel yang tersimpan di NVS mikrokontroler (ESP32) dengan indikator status sinkronisasi.
- **Evaluasi Pakar AI (Google Gemini):**
  - Analisis mendalam kondisi sensor tiap sektor secara berkala dengan rekomendasi tindakan preventif/solutif.
- **Log Aktivitas & Audit:**
  - Pencatatan riwayat setiap aksi kontrol, perubahan jadwal, dan aktivitas pengguna.
- **Sistem Notifikasi & Alert Threshold:**
  - Peringatan otomatis jika kondisi sensor melampaui batas aman.
- **Multi-bahasa & Tampilan Modern:**
  - Dukungan dwibahasa (Bahasa Indonesia & English) serta mode gelap (*Dark Mode*).

---

## 🛠️ Teknologi & Arsitektur

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Chart.js.
- **Backend:** Laravel 11 (REST API, Console Daemon MQTT, Queue, Events).
- **Komunikasi IoT:** MQTT over TLS (HiveMQ Cloud Broker) & WebSockets (Pusher).
- **Perangkat Keras:** ESP32, RTC DS3231, DHT22, MQ-135, Water Level Sensor, H-Bridge Driver, Relay Modules.
- **Database:**
  - *Lokal / Dev:* SQLite (`database/database.sqlite`)
  - *Produksi:* PostgreSQL (Supabase)

---

## 🚀 Cara Menjalankan di Lokal

### 1. Setup Backend (Laravel)

Pastikan telah menginstal **PHP 8.2+** dan **Composer**.

```bash
# Install dependensi PHP
composer install

# Siapkan environment
cp .env.example .env
php artisan key:generate

# Migrasi dan seed database bawaan
php artisan migrate --seed

# Jalankan server API backend
php artisan serve
```
Backend berjalan di `http://127.0.0.1:8000`.

> **Catatan Background MQTT Listener:**
> Untuk menerima dan memproses data sensor IoT secara terus-menerus ke database:
> ```bash
> php artisan mqtt:listen
> ```

---

### 2. Setup Frontend (React)

Buka terminal baru pada direktori `frontend`:

```bash
cd frontend

# Install dependensi Node.js
npm install

# Jalankan dev server
npm run dev
```
Frontend berjalan di `http://localhost:5173`.

---

## 🌐 Konfigurasi Database & Hosting

- **Mode SQLite (Lokal):**
  Konfigurasi default pada `.env`:
  ```env
  DB_CONNECTION=sqlite
  ```
- **Mode PostgreSQL (Supabase / Produksi):**
  Sesuaikan kredensial di file `.env`:
  ```env
  DB_CONNECTION=pgsql
  DB_HOST=db.xxxx.supabase.co
  DB_PORT=5432
  DB_DATABASE=postgres
  DB_USERNAME=postgres
  DB_PASSWORD=your_password
  ```
- **Frontend Hosting:**
  Dapat di-deploy dengan mudah ke platform seperti **Vercel** (`cd frontend && npm run build`).
- **Backend Hosting:**
  Dapat di-deploy ke **VPS** atau **Railway** dengan konfigurasi runtime background daemon worker.
