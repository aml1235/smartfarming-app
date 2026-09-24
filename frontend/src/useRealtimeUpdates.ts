import { useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import { API_URL } from './constants'

const PUSHER_KEY     = import.meta.env.VITE_PUSHER_APP_KEY     || ''
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1'

export interface SectorUpdatePayload {
  sector_id: string
  name: string
  status: string
  metrics: any
  updated_at: string
}

/**
 * Hook untuk menerima update realtime dari Pusher.
 *
 * Cara kerja:
 *  1. Membuat koneksi WebSocket ke Pusher saat komponen mount
 *  2. Subscribe ke kanal PRIVAT 'sector.{sector_id}' untuk setiap sektor
 *     yang dapat diakses pengguna (bukan lagi channel publik 'sectors').
 *  3. Pusher akan meminta otorisasi ke /broadcasting/auth (Laravel) dengan
 *     Bearer token pengguna — hanya sektor yang diizinkan canAccessSector()
 *     yang berhasil disubscribe.
 *  4. Listen event 'App\Events\SectorUpdated' dari Laravel Broadcasting
 *  5. Memanggil callback `onSectorUpdate` setiap ada data baru
 *
 * Parameter:
 *  - onSectorUpdate : callback dipanggil tiap kali ada update masuk
 *  - sectorIds      : daftar sector_id yang ingin dimonitor
 *
 * Jika VITE_PUSHER_APP_KEY tidak di-set, hook tidak melakukan apa-apa
 * (dashboard tetap berjalan dengan polling sebagai fallback).
 */
export function useRealtimeUpdates(
  onSectorUpdate: (data: SectorUpdatePayload) => void,
  sectorIds: string[] = [],
) {
  const pusherRef    = useRef<Pusher | null>(null)
  const callbackRef  = useRef(onSectorUpdate)
  callbackRef.current = onSectorUpdate

  // Kunci stabil — hanya re-subscribe jika daftar sektor berubah
  const sectorKey = sectorIds.slice().sort().join(',')

  useEffect(() => {
    if (!PUSHER_KEY) {
      console.log('[Realtime] VITE_PUSHER_APP_KEY not set, skipping realtime — polling only')
      return
    }

    const token = localStorage.getItem('token')

    // Buat koneksi Pusher dengan authEndpoint untuk private channel
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      // Endpoint otorisasi private channel Laravel — menggunakan auth:sanctum
      // Sesuai dengan Route::post('/broadcasting/auth',...) di routes/api.php
      authEndpoint: `${API_URL}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          Accept: 'application/json',
        },
      },
    })
    pusherRef.current = pusher

    // Connection lifecycle logging
    pusher.connection.bind('connected', () => {
      console.log('[Realtime] ✅ Connected to Pusher')
    })
    pusher.connection.bind('error', (err: any) => {
      console.warn('[Realtime] ⚠️ Pusher connection error:', err)
    })
    pusher.connection.bind('disconnected', () => {
      console.log('[Realtime] 🔌 Disconnected from Pusher (will auto-reconnect)')
    })

    if (sectorIds.length === 0) {
      console.log('[Realtime] No sector IDs provided yet, waiting...')
      return () => {
        pusher.disconnect()
        pusherRef.current = null
      }
    }

    // Subscribe ke private channel TERPISAH untuk setiap sektor
    const channels = sectorIds.map(sectorId => {
      const channelName = `private-sector.${sectorId}`
      const ch = pusher.subscribe(channelName)

      ch.bind('pusher:subscription_error', (err: any) => {
        console.warn(`[Realtime] ❌ Auth gagal untuk ${channelName}:`, err)
      })

      // Laravel Broadcasting mengirim event dengan nama class penuh
      ch.bind('App\\Events\\SectorUpdated', (data: SectorUpdatePayload) => {
        console.log('[Realtime] SectorUpdated:', data.sector_id, data.metrics)
        callbackRef.current(data)
      })

      return { channelName, ch }
    })

    console.log(`[Realtime] Subscribed to ${channels.length} private sector channel(s):`,
      channels.map(c => c.channelName))

    // Cleanup saat komponen unmount atau sectorIds berubah
    return () => {
      channels.forEach(({ channelName, ch }) => {
        ch.unbind_all()
        pusher.unsubscribe(channelName)
      })
      pusher.disconnect()
      pusherRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectorKey, PUSHER_KEY])

  return pusherRef
}
