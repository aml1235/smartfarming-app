import { useEffect, useRef } from 'react'
import Pusher from 'pusher-js'

const PUSHER_KEY = import.meta.env.VITE_PUSHER_APP_KEY || ''
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
 *  2. Subscribe ke channel publik 'sectors'
 *  3. Listen event 'App\Events\SectorUpdated' dari Laravel Broadcasting
 *  4. Memanggil callback `onSectorUpdate` setiap ada data baru
 *
 * Jika VITE_PUSHER_APP_KEY tidak di-set, hook tidak melakukan apa-apa
 * (dashboard tetap berjalan dengan polling sebagai fallback).
 */
export function useRealtimeUpdates(onSectorUpdate: (data: SectorUpdatePayload) => void) {
  const pusherRef = useRef<Pusher | null>(null)
  const callbackRef = useRef(onSectorUpdate)
  callbackRef.current = onSectorUpdate

  useEffect(() => {
    if (!PUSHER_KEY) {
      console.log('[Realtime] VITE_PUSHER_APP_KEY not set, skipping realtime — polling only')
      return
    }

    // Buat koneksi Pusher
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    })
    pusherRef.current = pusher

    // Subscribe ke channel publik 'sectors'
    const channel = pusher.subscribe('sectors')

    // Listen event SectorUpdated dari Laravel Broadcasting
    // Laravel mengirim event dengan nama fully-qualified class: App\Events\SectorUpdated
    channel.bind('App\\Events\\SectorUpdated', (data: SectorUpdatePayload) => {
      console.log('[Realtime] SectorUpdated:', data.sector_id, data.metrics)
      callbackRef.current(data)
    })

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

    // Cleanup saat komponen unmount
    return () => {
      channel.unbind_all()
      pusher.unsubscribe('sectors')
      pusher.disconnect()
      pusherRef.current = null
    }
  }, [])

  return pusherRef
}
