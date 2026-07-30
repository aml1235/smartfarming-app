import { PageId, AdminTab } from '../types'
import { IcLeaf, IcSettings, IcBell, IcLogOut, IcGrid, IcUsers, IcLink, IcClock } from './Icons'

interface SidebarProps {
  activeId: PageId | AdminTab;
  onSelect: (id: any) => void;
  alertCount: number;
  unitAktif: number;
  onLogout: () => void;
  isAdmin?: boolean;
  assignedSectors?: string[];
}

export function Sidebar({ activeId, onSelect, alertCount, unitAktif, onLogout, isAdmin, assignedSectors }: SidebarProps) {
  const userNav: { id: PageId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'kandang', label: 'Kandang Ayam', icon: '🐓' },
    { id: 'kolam', label: 'Kolam Ikan', icon: '🐟' },
    { id: 'hidroponik', label: 'Hidroponik', icon: '🌿' },
    { id: 'irigasi', label: 'Irigasi Tanah', icon: '🌱' },
  ]
  
  const filteredUserNav = userNav.filter(item => 
    isAdmin || item.id === 'overview' || (assignedSectors && assignedSectors.includes(item.id))
  );

  const adminNav: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <IcGrid size={15} /> },
    { id: 'users', label: 'Kelola Pengguna', icon: <IcUsers size={15} /> },
    { id: 'assign', label: 'Assign Sektor', icon: <IcLink size={15} /> },
    { id: 'activity', label: 'Aktivitas', icon: <IcClock size={15} /> },
  ]

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcLeaf size={18} color="var(--bg-surface)" />
          </div>
          <div>
            <div className="brand-name">Smart Farming</div>
            <div className="brand-sub">{isAdmin ? 'Admin Panel' : 'Dashboard Monitoring'}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <div className="section-label" style={{ marginTop: 12 }}>{isAdmin ? 'MENU ADMIN' : 'MONITORING'}</div>
        
        {!isAdmin && filteredUserNav.map(item => (
          <button
            key={item.id}
            className={`nav-link ${activeId === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span style={{ fontSize: 15, width: 22, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        {isAdmin && adminNav.map(item => (
          <button
            key={item.id}
            className={`nav-link ${activeId === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span style={{ width: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="section-label" style={{ marginTop: 20 }}>PENGATURAN</div>
        <button
          className={`nav-link ${activeId === 'settings' ? 'active' : ''}`}
          onClick={() => onSelect('settings')}
        >
          <span style={{ width: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}><IcSettings size={15} /></span>
          Pengaturan
        </button>
        {!isAdmin && (
          <button
            className={`nav-link ${activeId === 'notifications' ? 'active' : ''}`}
            onClick={() => onSelect('notifications')}
          >
            <span style={{ width: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}><IcBell size={15} /></span>
            Notifikasi
            {alertCount > 0 && (
              <span className="badge badge-red" style={{ marginLeft: 'auto', padding: '2px 7px', fontSize: 10 }}>{alertCount}</span>
            )}
          </button>
        )}
      </nav>

      {/* Status Removed */}

      {/* Footer */}
      <div className="sidebar-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
        <button 
          onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'all 0.2s' }}
        >
          <IcLogOut size={20} /> Logout Akun
        </button>
      </div>
    </aside>
  )
}
