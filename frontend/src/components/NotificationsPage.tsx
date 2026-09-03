import { useState } from 'react'
import { AppNotification } from '../types'
import { IcCheck, IcBell } from './Icons'
import { useLanguage } from '../i18n'

interface NotificationsPageProps {
  notifications: AppNotification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

type FilterType = 'all' | 'alert' | 'warning' | 'success' | 'info'

const getFilterOptions = (t: any): { value: FilterType; label: string }[] => [
  { value: 'all', label: t('filter_all') },
  { value: 'alert', label: t('filter_alert') },
  { value: 'warning', label: t('filter_warning') },
  { value: 'success', label: t('filter_success') },
  { value: 'info', label: t('filter_info') },
]

const NOTIF_ICONS: Record<string, string> = {
  alert: '🚨',
  warning: '⚠️',
  success: '✅',
  info: 'ℹ️',
}

export function NotificationsPage({ notifications, onMarkRead, onMarkAllRead }: NotificationsPageProps) {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{t('notifications')}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
            {unreadCount > 0 ? `${unreadCount} ${t('notif_unread')}` : t('notif_all_read')}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={onMarkAllRead}>
            <IcCheck size={14} /> {t('mark_all_read')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="notif-filters">
        {getFilterOptions(t).map(opt => (
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
            <p style={{ marginTop: 12, fontSize: 14 }}>{t('notif_empty')}</p>
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              className={`notif-item ${!notif.read ? 'unread' : ''}`}
              onClick={() => !notif.read && onMarkRead(notif.id)}
              style={{ cursor: !notif.read ? 'pointer' : 'default' }}
            >
              <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                {NOTIF_ICONS[notif.type] || 'ℹ️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {(notif as any).title && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {(notif as any).title}
                  </div>
                )}
                <div className="notif-message" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{notif.message}</div>
                {notif.sectorId && (
                  <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, display: 'inline-block' }}>
                    {t('notif_sector')} {notif.sectorId}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div className="notif-time" style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {notif.timestamp || (notif as any).time}
                </div>
                {!notif.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

