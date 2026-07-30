import { Sector, StatusLevel, User, AppNotification, ActivityLog } from './types'

export const SECTORS: Sector[] = [
  { id: 'kandang', name: 'Kandang Ayam', unit: 'Peternakan', icon: '🐓', color: '#E65100', colorLight: 'var(--kandang-light)', status: 'baik', lastUpdate: '2 mnt lalu' },
  { id: 'kolam', name: 'Kolam Ikan', unit: 'Akuakultur', icon: '🐟', color: '#1565C0', colorLight: 'var(--kolam-light)', status: 'normal', lastUpdate: '1 mnt lalu' },
  { id: 'hidroponik', name: 'Hidroponik', unit: 'Tanaman', icon: '🌿', color: '#2E7D32', colorLight: 'var(--hidroponik-light)', status: 'baik', lastUpdate: '3 mnt lalu' },
  { id: 'irigasi', name: 'Irigasi Tanah', unit: 'Pertanian', icon: '🌱', color: '#795548', colorLight: 'var(--irigasi-light)', status: 'peringatan', lastUpdate: '5 mnt lalu' },
]

export const STATUS_MAP: Record<StatusLevel, { label: string; cls: string }> = {
  baik: { label: 'Baik', cls: 'badge-green' },
  normal: { label: 'Normal', cls: 'badge-blue' },
  peringatan: { label: 'Peringatan', cls: 'badge-amber' },
  kritis: { label: 'Kritis', cls: 'badge-red' },
}

export function generateTempData() {
  const base = [26, 27, 28, 29, 30, 31, 30, 29, 28, 28, 29, 30]
  const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
  return hours.map((h, i) => ({
    time: h,
    suhu: base[i] + (Math.random() * 1 - 0.5),
    optimal: 28,
  }))
}

// Deteksi otomatis URL API berdasarkan lingkungan (lokal atau Vercel)
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://smartfarming-app.up.railway.app');