import { API_URL } from './constants'
import { useState, useEffect, useCallback } from 'react'
import { Sector, SectorId, PageId, AppView, User, AppNotification } from './types'
import { SECTORS } from './constants'
import { Sidebar } from './components/Sidebar'
import { OverviewMetrics, SectorCard } from './components/DashboardComponents'
import { AddSectorModal, KandangDetail, GenericDetail } from './components/Modals'
import { LandingPage } from './components/LandingPage'
import { LoginPage } from './components/LoginPage'
import { AdminPage } from './components/AdminPage'
import { SectorDashboard } from './components/SectorDashboard'
import { NotificationsPage } from './components/NotificationsPage'
import { SettingsPage } from './components/SettingsPage'
import { ApkDownloadPage } from './components/ApkDownloadPage'
import { IcMenu, IcLeaf, IcBell, IcPlus, IcSun, IcMoon } from './components/Icons'

export default function App() {
  const [appView, setAppView] = useState<AppView>('landing')
  const [isInitializing, setIsInitializing] = useState(true)
  const [page, setPage] = useState<PageId>('overview')
  const [detailSector, setDetailSector] = useState<Sector | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sectors, setSectors] = useState<Sector[]>(SECTORS)
  const [users, setUsers] = useState<User[]>([])
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  
  const fetchNotifications = () => {
    fetch(`${API_URL}/api/notifications`)
      .then(res => res.json())
      .then(data => {
        // Map backend model to AppNotification interface
        const mapped = data.map((n: any) => ({
          id: n.id.toString(),
          title: n.title,
          message: n.message,
          time: new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          type: n.type,
          read: n.is_read
        }));
        setNotifications(mapped);
      })
      .catch(err => console.error(err));
  };
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Check auth first
    if (token) {
      fetch(`${API_URL}/api/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Invalid token');
      })
      .then(user => {
        setLoggedInUser({
          ...user,
          assignedSectors: user.assigned_sectors || user.assignedSectors || []
        });
        if (user.role === 'admin') setAppView('superadmin');
        else { setAppView('dashboard'); setPage('overview'); }
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setIsInitializing(false));

      fetchNotifications();
    } else {
      setIsInitializing(false);
    }

    const fetchSectors = () => {
      fetch(`${API_URL}/api/sectors`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            if (data.length === 0) {
              setSectors([]);
            } else {
              const apiSectors = data.map((d: any) => {
                const base = SECTORS.find(s => s.id === d.sector_id) || SECTORS[0];
                let lastUpdateStr = base.lastUpdate;
                if (d.updated_at) {
                  let updateTimeStr = d.updated_at;
                  if (typeof updateTimeStr === 'string' && !updateTimeStr.includes('T')) {
                     updateTimeStr = updateTimeStr.replace(' ', 'T') + 'Z';
                  } else if (typeof updateTimeStr === 'string' && !updateTimeStr.endsWith('Z')) {
                     updateTimeStr += 'Z';
                  }
                  const updateTime = new Date(updateTimeStr);
                  const diffMins = Math.floor((Date.now() - updateTime.getTime()) / 60000);
                  if (diffMins < 1) lastUpdateStr = 'Baru saja';
                  else if (diffMins < 60) lastUpdateStr = `${diffMins} mnt lalu`;
                  else if (diffMins < 1440) lastUpdateStr = `${Math.floor(diffMins/60)} jam lalu`;
                  else lastUpdateStr = `${Math.floor(diffMins/1440)} hari lalu`;
                }
                return { ...base, ...d, id: d.sector_id, metrics: d.metrics, lastUpdate: lastUpdateStr };
              });
              setSectors(apiSectors);
            }
          }
        })
        .catch(err => console.log('API sectors error (using local state)', err));
    };
    
    const fetchUserData = () => {
      const t = localStorage.getItem('token');
      if (!t) return;
      fetch(`${API_URL}/api/user`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      .then(res => res.json())
      .then(user => {
        if (user && user.id) {
          setLoggedInUser(prev => ({
            ...prev,
            ...user,
            assignedSectors: user.assigned_sectors || user.assignedSectors || []
          }));
        }
      })
      .catch(() => {});
    };

    fetchSectors();
    const dataInterval = setInterval(() => {
      fetchSectors();
      fetchUserData();
    }, 5000);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(`${API_URL}/api/users`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setUsers(data);
      })
      .catch(err => console.log('API users error (using local state)', err));

    return () => clearInterval(dataInterval);
  }, []);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const [clock, setClock] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleAddSector = useCallback((name: string, type: string) => {
    const base = SECTORS.find(s => s.id === type as SectorId) || SECTORS[0]
    const newSector: Sector = {
      ...base,
      id: `${type}_${Date.now()}` as SectorId,
      name,
      lastUpdate: 'Baru saja',
      status: 'baik',
    }
    setSectors(prev => [...prev, newSector])
  }, [])

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogin = (user: any) => {
    setLoggedInUser({
      ...user,
      assignedSectors: user.assigned_sectors || user.assignedSectors || []
    })
    if (user.role === 'admin') {
      setAppView('superadmin')
    } else {
      setAppView('dashboard')
      setPage('overview')
    }
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    localStorage.removeItem('token')
    setAppView('landing')
    setPage('overview')
    setShowLogoutModal(false)
  }

  const handleMarkRead = (id: string) => {
    fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'PUT' })
      .then(() => fetchNotifications())
      .catch(err => console.error(err));
  }

  const handleMarkAllRead = () => {
    fetch(`${API_URL}/api/notifications/read-all`, { method: 'PUT' })
      .then(() => fetchNotifications())
      .catch(err => console.error(err));
  }

  const openDetail = (s: Sector) => setDetailSector(s)
  const closeDetail = () => setDetailSector(null)

  const alertCount = notifications.filter(n => !n.read).length

  // Get page title
  const getPageTitle = () => {
    if (page === 'overview') return 'Ringkasan Keseluruhan'
    if (page === 'notifications') return 'Notifikasi'
    if (page === 'settings') return 'Pengaturan'
    const sector = sectors.find(s => s.id === page)
    return sector?.name || 'Dashboard'
  }

  const renderLogoutModal = () => {
    if (!showLogoutModal) return null;
    return (
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
        <div className="modal-sheet" style={{ background: 'var(--bg-surface)', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </div>
          <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Konfirmasi Keluar</h3>
          <p style={{ margin: '0 0 32px', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.5 }}>Apakah Anda yakin ingin keluar dari aplikasi Smart Farming?</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowLogoutModal(false)} className="btn btn-ghost" style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', transition: 'background 0.2s' }}>Batal</button>
            <button onClick={confirmLogout} className="btn btn-primary" style={{ flex: 1, padding: '12px 16px', background: '#ef4444', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)' }}>Ya, Keluar</button>
          </div>
        </div>
      </div>
    );
  }

  // LANDING PAGE
  if (isInitializing) {
    return <div style={{ height: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: 'var(--text-primary)' }}>Memuat...</div></div>
  }

  // LANDING PAGE
  if (appView === 'landing') {
    return <LandingPage onLogin={() => setAppView('login')} onDownloadApk={() => setAppView('apk_download')} darkMode={darkMode} setDarkMode={setDarkMode} />
  }

  // LOGIN PAGE
  if (appView === 'login') {
    return <LoginPage onLogin={handleLogin} onBack={() => setAppView('landing')} darkMode={darkMode} setDarkMode={setDarkMode} />
  }

  // APK DOWNLOAD PAGE
  if (appView === 'apk_download') {
    return <ApkDownloadPage onBack={() => setAppView('landing')} />
  }

  // SUPER ADMIN PANEL
  if (appView === 'superadmin') {
    return (
      <>
        <AdminPage
          sectors={sectors}
          users={users}
          onLogout={handleLogout}
          onUpdateUsers={setUsers}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          loggedInUser={loggedInUser!}
          onUpdateUser={(updatedUser) => setLoggedInUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser)}
        />
        {renderLogoutModal()}
      </>
    )
  }

  // USER DASHBOARD
  const userSectors = sectors.filter(s => loggedInUser?.role === 'admin' || loggedInUser?.assignedSectors?.includes(s.id as any));
  const alertCountFiltered = userSectors.filter(s => s.status === 'peringatan' || s.status === 'kritis').length;

  return (
    <div className="app-layout">
      <div className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar
          activeId={page}
          onSelect={id => { setPage(id); setSidebarOpen(false) }}
          alertCount={alertCount}
          unitAktif={sectors.filter(s => loggedInUser?.role === 'admin' || loggedInUser?.assignedSectors?.includes(s.id as any)).length}
          onLogout={handleLogout}
          isAdmin={loggedInUser?.role === 'admin'}
          assignedSectors={loggedInUser?.assignedSectors || []}
          dynamicSectors={sectors}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="app-main">
        {/* Header */}
        <header className="app-header">
          <button className="mobile-header menu-button" onClick={() => setSidebarOpen(true)}>
            <IcMenu />
          </button>

          <div className="mobile-header mobile-brand">
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IcLeaf size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Smart Farming</span>
          </div>

          <div className="header-title">
            <div>{getPageTitle()}</div>
          </div>

          <div className="header-actions">
            <div className="date-time-wrapper" style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span>{clock.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' })}</span>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}</span>
            </div>

            <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'none', border: '1px solid var(--border-color)', cursor: 'pointer', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.3s' }}>
              {darkMode ? <IcMoon size={20} /> : <IcSun size={20} />}
            </button>
            <button
              onClick={() => setPage('notifications')}
              style={{ position: 'relative', background: 'none', border: '1px solid #e5e7eb', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <IcBell size={16} />
              {alertCount > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#dc2626', border: '2px solid #fff' }} />}
            </button>


            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid #e5e7eb', marginLeft: 2 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {loggedInUser ? loggedInUser.name.substring(0, 2).toUpperCase() : 'OP'}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                  {loggedInUser ? loggedInUser.name : 'Operator'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {loggedInUser?.role === 'admin' ? 'Administrator' : 'Monitoring'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="app-content">
          {/* Notifications Page */}
          {page === 'notifications' ? (
            <NotificationsPage
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
          ) : page === 'settings' ? (
            <SettingsPage 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              user={loggedInUser}
              onUpdateUser={(updatedUser) => setLoggedInUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser)}
            />
          ) : page !== 'overview' ? (
            /* Individual Sector Dashboard */
            sectors.find(s => s.id === page) ? (
              <SectorDashboard key={page} sector={sectors.find(s => s.id === page)!} loggedInUser={loggedInUser} />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Belum Dikonfigurasi</h2>
                <p>Data untuk sektor ini belum ditambahkan ke database.</p>
              </div>
            )
          ) : (
            /* Overview */
            <>
              <div className="stats-grid">
                {[
                  { label: 'Sektor Aktif', value: `${userSectors.length}`, sub: 'Unit terdaftar', color: '#059669', bg: '#dcfce7' },
                  { label: 'Kondisi Baik', value: `${userSectors.filter(s => s.status === 'baik' || s.status === 'normal').length}`, sub: 'Sektor normal', color: '#2563eb', bg: '#dbeafe' },
                  { label: 'Peringatan', value: `${alertCountFiltered}`, sub: alertCountFiltered ? 'Perlu perhatian' : 'Semua aman', color: alertCountFiltered ? '#d97706' : '#059669', bg: alertCountFiltered ? '#fef3c7' : '#dcfce7' },
                  { label: 'Uptime Sistem', value: '99.4%', sub: 'Stabil', color: '#059669', bg: '#dcfce7' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ minWidth: 44, padding: '0 10px', height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: s.color }}>{s.value}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="section-header">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Monitoring</div>
                  <h2 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Semua Sektor Pertanian</h2>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {loggedInUser?.role !== 'admin' && loggedInUser?.assignedSectors?.length === 0 ? '0' : sectors.filter(s => loggedInUser?.role === 'admin' || loggedInUser?.assignedSectors?.includes(s.id as any)).length} sektor aktif
                </span>
              </div>

              {loggedInUser?.role !== 'admin' && loggedInUser?.assignedSectors?.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
                  <IcLeaf size={48} color="var(--border-color)" />
                  <h3 style={{ color: 'var(--text-primary)', marginTop: '16px', fontSize: '1.2rem', fontWeight: 600 }}>Dashboard Kosong</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Anda belum ditugaskan ke sektor manapun. Silakan hubungi Administrator untuk mendapatkan akses pemantauan sektor.</p>
                </div>
              ) : (
                <div className="sector-grid">
                  {sectors
                    .filter(s => loggedInUser?.role === 'admin' || loggedInUser?.assignedSectors?.includes(s.id as any))
                    .map(s => (
                    <SectorCard
                      key={s.id}
                      sector={{ ...s, metrics: <OverviewMetrics id={['kandang','kolam','hidroponik','irigasi'].includes(s.id as any) ? s.id as SectorId : (String(s.id).split('_')[0] as SectorId)} /> }}
                      onOpen={() => openDetail(s)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {detailSector && (String(detailSector.id).startsWith('kandang') || String(detailSector.id) === 'SEC-011') && <KandangDetail sector={detailSector} onBack={closeDetail} />}
      {detailSector && !(String(detailSector.id).startsWith('kandang') || String(detailSector.id) === 'SEC-011') && <GenericDetail sector={detailSector} onBack={closeDetail} />}
      {showAddModal && <AddSectorModal onClose={() => setShowAddModal(false)} onAdd={handleAddSector} />}
      {renderLogoutModal()}
    </div>
  )
}

