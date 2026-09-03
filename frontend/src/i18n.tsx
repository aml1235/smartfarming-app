import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'id' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, args?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionary = {
  id: {
    // General
    'normal': 'Normal',
    'hot': 'Panas',
    'warm': 'Hangat',
    'cold': 'Dingin',
    'empty': 'Kosong',
    'medium': 'Sedang',
    'full': 'Penuh',
    'update': 'Perbarui',
    'history': 'Grafik Riwayat',
    'history_desc': '24 Jam Terakhir',
    'historical_data': 'Data Historis',
    'manual': 'Manual',
    'auto': 'Otomatis',
    'status': 'Status',

    // Sector Dashboard
    'monitoring_rt': 'Monitoring Real-time',
    'ai_analysis': 'Analisis AI',
    'temp': 'Suhu',
    'humidity': 'Kelembapan',
    'ammonia': 'Amonia',
    'water_level': 'Level Air',
    'water_tank_status': 'Status Tangki',
    'water_for_drink': 'Air Untuk Minum',
    'solar_panel_info': 'Info Panel Surya',
    'power_generated': 'Daya Dihasilkan',
    'battery_status': 'Status Baterai (Aki)',
    'feed_left': 'Sisa Pakan',
    'lamp_cage': 'Lampu Kandang',
    'water_pump': 'Pompa Air',
    'feed_unit': 'Unit Pakan',
    'feed_motor': 'Motor Pakan',
    'run': 'Jalankan',
    'stop': 'Stop',
    'forward': 'Maju',
    'backward': 'Mundur',
    'auto_active': '(Auto aktif)',
    'on': 'Menyala',
    'off': 'Mati',
    'opening': 'Membuka...',
    'closed': 'Tertutup',
    'running': 'Jalan',
    'idle': 'Diam',

    // Sidebar & Navigation
    'dashboard': 'Dashboard',
    'hydroponics': 'Hidroponik',
    'unhan_cage': 'Kandang Ayam Unhan',
    'bengpuskomlek_cage': 'Kandang Ayam Bengpuskomlek',
    'settings': 'Pengaturan',
    'notifications': 'Notifikasi',
    'logout': 'Logout Akun',

    // Landing Page
    'lp_sector': 'Sektor',
    'lp_features': 'Fitur',
    'lp_how_it_works': 'Cara Kerja',
    'lp_login': 'Masuk',
    'lp_login_dashboard': 'Masuk Dashboard',
    'lp_hero_badge': 'Sistem Terpadu Generasi Baru',
    'lp_hero_title1': 'Monitoring ',
    'lp_hero_title_highlight': 'Pertanian Cerdas',
    'lp_hero_title2': ' untuk Produksi Optimal',
    'lp_hero_desc': 'Tingkatkan efisiensi produksi dan kelola empat sektor pertanian Anda dari satu dashboard terpadu berbasis IoT.',
    'lp_start_now': 'Mulai Sekarang',
    'lp_download_apk': 'Unduh APK Android',
    'lp_active_sectors': 'Sektor Aktif',
    'lp_system_uptime': 'Uptime Sistem',
    'lp_feature1_title': 'Monitoring Real-time',
    'lp_feature1_desc': 'Pantau suhu, kelembapan, pH dari satu dashboard terpadu.',
    'lp_feature2_title': 'Keamanan & Kontrol',
    'lp_feature2_desc': 'Akses sistem diatur secara ketat hanya untuk personel berwenang.',
    'lp_feature3_title': 'Multi-Perangkat',
    'lp_feature3_desc': 'Responsif di desktop, tablet, dan ponsel.',

    // Login Page
    'login_subtitle': 'Masuk ke platform monitoring',
    'forgot_subtitle': 'Atur ulang password Anda',
    'reset_subtitle': 'Buat password baru',
    'email_label': 'Email',
    'email_placeholder': 'Masukkan email Anda',
    'password_label': 'Password',
    'new_password_label': 'Password Baru',
    'password_placeholder': '********',
    'forgot_password': 'Lupa Password?',
    'login_btn': 'Masuk Sekarang',
    'login_wait': 'Mohon Tunggu...',
    'back_to_login': 'Kembali ke Login',

    // Apk Download Page
    'apk_title': 'Smart Farming Indonesia',
    'apk_author': 'Kadet Informatika Universitas Pertahanan RI',
    'apk_contains_ads': 'Berisi Iklan · Pembelian Dalam Aplikasi',
    'apk_reviews': '12 rb ulasan',
    'apk_downloads': 'Download',
    'apk_rating': 'Rating 3+',
    'apk_install': 'Instal APK',
    'apk_about': 'Tentang aplikasi ini',
    'apk_about_desc': 'Tingkatkan efisiensi produksi dan kelola sektor pertanian Anda dari satu genggaman dengan aplikasi Smart Farming. Sistem monitoring terpadu berbasis IoT yang dirancang khusus untuk memenuhi kebutuhan pertanian modern di Indonesia. Pantau parameter krusial seperti suhu, kelembapan, intensitas cahaya, level air, dan pH secara real-time.',
    'apk_data_safety': 'Keamanan Data',
    'apk_data_safety_desc': 'Keamanan dimulai dengan memahami cara developer mengumpulkan dan membagikan data Anda. Praktik privasi dan keamanan data mungkin berbeda-beda berdasarkan penggunaan, wilayah, dan usia Anda.',
    'apk_data_not_shared': 'Data tidak dibagikan kepada pihak ketiga',
    'apk_data_encrypted': 'Data dienkripsi dalam perjalanan',

    // Settings Page
    'settings_title': 'Pengaturan Akun',
    'settings_desc': 'Kelola informasi profil dan keamanan akun Anda',
    'profile_edit_title': 'Edit Profil',
    'profile_edit_desc': 'Perbarui nama dan alamat email Anda',
    'full_name_label': 'Nama Lengkap',
    'email_address_label': 'Alamat Email',
    'save_changes': 'Simpan Perubahan',
    'saving': 'Menyimpan...',
    'password_change_title': 'Ganti Password',
    'password_change_desc': 'Tingkatkan keamanan dengan memperbarui password Anda',
    'old_password_label': 'Password Lama',
    'confirm_password_label': 'Konfirmasi Password',
    'update_password_btn': 'Perbarui Password',

    // Notifications Page
    'notif_unread': 'notifikasi belum dibaca',
    'notif_all_read': 'Semua notifikasi sudah dibaca',
    'mark_all_read': 'Tandai Semua Dibaca',
    'filter_all': 'Semua',
    'filter_alert': '🔴 Alert',
    'filter_warning': '🟡 Peringatan',
    'filter_success': '🟢 Sukses',
    'filter_info': '🔵 Info',
    'notif_empty': 'Tidak ada notifikasi untuk filter ini',
    'notif_sector': 'Sektor:',

    // Admin Page
    'admin_panel': 'Panel Admin',
    'admin_dashboard': 'Dashboard',
    'admin_users': 'Manajemen Pengguna',
    'admin_sectors': 'Sektor Pertanian',
    'admin_activity': 'Log Aktivitas',
    'admin_settings': 'Pengaturan Sistem',
    'admin_add_user': 'Tambah Pengguna Baru',
    'admin_add_sector': 'Tambah Sektor Baru',

    // Sector Names & Units
    'sector_hidroponik': 'Hidroponik',
    'sector_kandang_unhan': 'Kandang Ayam Unhan',
    'sector_kandang_bengpuskomlek': 'Kandang Ayam Bengpuskomlek',
    'unit_tanaman': 'Tanaman',
    'unit_peternakan': 'Peternakan',
    
    // Status & Time
    'status_baik': 'Baik',
    'status_normal': 'Normal',
    'status_waspada': 'Waspada',
    'status_kritis': 'Kritis',
    'status_bahaya': 'Bahaya',
    'manage': 'Kelola',
    'updated': 'Diperbarui',
    'just_now': 'Baru saja',
    'mins_ago': 'mnt lalu',
    'hours_ago': 'jam lalu',
    'days_ago': 'hari lalu',
  },
  en: {
    // General
    'normal': 'Normal',
    'hot': 'Hot',
    'warm': 'Warm',
    'cold': 'Cold',
    'empty': 'Empty',
    'medium': 'Medium',
    'full': 'Full',
    'update': 'Refresh',
    'history': 'History Chart',
    'history_desc': 'Last 24 Hours',
    'historical_data': 'Historical Data',
    'manual': 'Manual',
    'auto': 'Auto',
    'status': 'Status',

    // Sector Dashboard
    'monitoring_rt': 'Real-time Monitoring',
    'ai_analysis': 'AI Analysis',
    'temp': 'Temperature',
    'humidity': 'Humidity',
    'ammonia': 'Ammonia',
    'water_level': 'Water Level',
    'water_tank_status': 'Tank Status',
    'water_for_drink': 'Drinking Water',
    'solar_panel_info': 'Solar Panel Info',
    'power_generated': 'Power Generated',
    'battery_status': 'Battery Status',
    'feed_left': 'Feed Left',
    'lamp_cage': 'Cage Lamp',
    'water_pump': 'Water Pump',
    'feed_unit': 'Feed Unit',
    'feed_motor': 'Feed Motor',
    'run': 'Run',
    'stop': 'Stop',
    'forward': 'Forward',
    'backward': 'Backward',
    'auto_active': '(Auto active)',
    'on': 'On',
    'off': 'Off',
    'opening': 'Opening...',
    'closed': 'Closed',
    'running': 'Running',
    'idle': 'Idle',

    // Sidebar & Navigation
    'dashboard': 'Dashboard',
    'hydroponics': 'Hydroponics',
    'unhan_cage': 'Unhan Chicken Cage',
    'bengpuskomlek_cage': 'Bengpuskomlek Cage',
    'settings': 'Settings',
    'notifications': 'Notifications',
    'logout': 'Logout Account',

    // Landing Page
    'lp_sector': 'Sectors',
    'lp_features': 'Features',
    'lp_how_it_works': 'How It Works',
    'lp_login': 'Log In',
    'lp_login_dashboard': 'Login to Dashboard',
    'lp_hero_badge': 'Next-Gen Integrated System',
    'lp_hero_title1': 'Smart ',
    'lp_hero_title_highlight': 'Agricultural Monitoring',
    'lp_hero_title2': ' for Optimal Production',
    'lp_hero_desc': 'Increase production efficiency and manage your four agricultural sectors from one integrated IoT-based dashboard.',
    'lp_start_now': 'Start Now',
    'lp_download_apk': 'Download Android APK',
    'lp_active_sectors': 'Active Sectors',
    'lp_system_uptime': 'System Uptime',
    'lp_feature1_title': 'Real-time Monitoring',
    'lp_feature1_desc': 'Monitor temperature, humidity, pH from one integrated dashboard.',
    'lp_feature2_title': 'Security & Control',
    'lp_feature2_desc': 'System access is strictly regulated only for authorized personnel.',
    'lp_feature3_title': 'Multi-Device',
    'lp_feature3_desc': 'Responsive on desktop, tablet, and mobile phones.',

    // Login Page
    'login_subtitle': 'Login to monitoring platform',
    'forgot_subtitle': 'Reset your password',
    'reset_subtitle': 'Create new password',
    'email_label': 'Email',
    'email_placeholder': 'Enter your email',
    'password_label': 'Password',
    'new_password_label': 'New Password',
    'password_placeholder': '********',
    'forgot_password': 'Forgot Password?',
    'login_btn': 'Login Now',
    'login_wait': 'Please Wait...',
    'back_to_login': 'Back to Login',

    // Apk Download Page
    'apk_title': 'Smart Farming Indonesia',
    'apk_author': 'Informatics Cadets of Defense University of RI',
    'apk_contains_ads': 'Contains Ads · In-App Purchases',
    'apk_reviews': '12k reviews',
    'apk_downloads': 'Downloads',
    'apk_rating': 'Rated for 3+',
    'apk_install': 'Install APK',
    'apk_about': 'About this app',
    'apk_about_desc': 'Increase production efficiency and manage your agricultural sector from the palm of your hand with the Smart Farming app. An integrated IoT-based monitoring system specifically designed to meet the needs of modern agriculture in Indonesia. Monitor crucial parameters such as temperature, humidity, light intensity, water level, and pH in real-time.',
    'apk_data_safety': 'Data Safety',
    'apk_data_safety_desc': 'Safety starts with understanding how developers collect and share your data. Data privacy and security practices may vary based on your use, region, and age.',
    'apk_data_not_shared': 'No data shared with third parties',
    'apk_data_encrypted': 'Data is encrypted in transit',

    // Settings Page
    'settings_title': 'Account Settings',
    'settings_desc': 'Manage your profile information and account security',
    'profile_edit_title': 'Edit Profile',
    'profile_edit_desc': 'Update your name and email address',
    'full_name_label': 'Full Name',
    'email_address_label': 'Email Address',
    'save_changes': 'Save Changes',
    'saving': 'Saving...',
    'password_change_title': 'Change Password',
    'password_change_desc': 'Improve security by updating your password',
    'old_password_label': 'Old Password',
    'confirm_password_label': 'Confirm Password',
    'update_password_btn': 'Update Password',

    // Notifications Page
    'notif_unread': 'unread notifications',
    'notif_all_read': 'All notifications have been read',
    'mark_all_read': 'Mark All as Read',
    'filter_all': 'All',
    'filter_alert': '🔴 Alert',
    'filter_warning': '🟡 Warning',
    'filter_success': '🟢 Success',
    'filter_info': '🔵 Info',
    'notif_empty': 'No notifications for this filter',
    'notif_sector': 'Sector:',

    // Admin Page
    'admin_panel': 'Admin Panel',
    'admin_dashboard': 'Dashboard',
    'admin_users': 'User Management',
    'admin_sectors': 'Agricultural Sectors',
    'admin_activity': 'Activity Logs',
    'admin_settings': 'System Settings',
    'admin_add_user': 'Add New User',
    'admin_add_sector': 'Add New Sector',

    // Sector Names & Units
    'sector_hidroponik': 'Hydroponics',
    'sector_kandang_unhan': 'Unhan Chicken Coop',
    'sector_kandang_bengpuskomlek': 'Bengpuskomlek Chicken Coop',
    'unit_tanaman': 'Crops',
    'unit_peternakan': 'Livestock',
    
    // Status & Time
    'status_baik': 'Good',
    'status_normal': 'Normal',
    'status_waspada': 'Warning',
    'status_kritis': 'Critical',
    'status_bahaya': 'Danger',
    'manage': 'Manage',
    'updated': 'Updated',
    'just_now': 'Just now',
    'mins_ago': 'mins ago',
    'hours_ago': 'hours ago',
    'days_ago': 'days ago',
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('id');

  const t = (key: string, args?: Record<string, string | number>) => {
    let text = (dictionary[lang] as any)[key] || key;
    if (args) {
      Object.keys(args).forEach(k => {
        text = text.replace(`{${k}}`, String(args[k]));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
