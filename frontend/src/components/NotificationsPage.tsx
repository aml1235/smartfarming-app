import { useState } from 'react'
import { AppNotification } from '../types'
import { IcCheck, IcBell } from './Icons'

interface NotificationsPageProps {
  notifications: AppNotification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

type FilterType = 'all' | 'alert' | 'warning' | 'success' | 'info'

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'alert', label: 'ðŸ”´ Alert' },
  { value: 'warning', label: 'ðŸŸ¡ Peringatan' },
  { value: 'success', label: 'ðŸŸ¢ Sukses' },
  { value: 'info', label: 'ðŸ”µ Info' },
]

export function NotificationsPage({ notifications, onMarkRead, onMarkAllRead }: NotificationsPageProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Notifikasi</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={onMarkAllRead}>
            <IcCheck size={14} /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="notif-filters">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`notif-filter ${filter === opt.value ? 'active' : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="notif-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
            <IcBell size={32} />
            <p style={{ marginTop: 12, fontSize: 14 }}>Tidak ada notifikasi untuk filter ini</p>
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              className={`notif-item ${!notif.read ? 'unread' : ''}`}
              onClick={() => !notif.read && onMarkRead(notif.id)}
            >
              <div className={`notif-dot ${notif.type}`} />
              <div style={{ flex: 1 }}>
                <div className="notif-message">{notif.message}</div>
                {notif.sectorId && (
                  <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, display: 'inline-block' }}>
                    Sektor: {notif.sectorId}
                  </span>
                )}
              </div>
              <div className="notif-time">{notif.timestamp}</div>
              {!notif.read && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

