import React, { useState, useCallback, useEffect } from 'react';
import { Sector, SectorId, User, AdminTab, ActivityLog } from '../types';
import { SECTORS, STATUS_MAP } from '../constants';
import {
  IcLeaf, IcGrid, IcUsers, IcLink, IcClock, IcSettings,
  IcLogOut, IcEdit, IcTrash, IcSearch,
  IcCheck, IcX, IcUserPlus, IcShield, IcBell, IcSun, IcMoon, IcEye, IcEyeOff
} from './Icons';
import { Toggle } from './UIComponents';
import { SettingsPage } from './SettingsPage';
import { Sidebar } from './Sidebar';

interface AdminPageProps {
  sectors: Sector[];
  users: User[];
  onLogout: () => void;
  onUpdateUsers: (users: User[]) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  loggedInUser: User;
  onUpdateUser: (user: User) => void;
}

export function AdminPage({ sectors, users, onLogout, onUpdateUsers, darkMode, setDarkMode, loggedInUser, onUpdateUser }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activities, setActivities] = useState<any[]>([]);

  const fetchActivities = useCallback(() => {
    fetch('http://127.0.0.1:8000/api/activities')
      .then(res => res.json())
      .then(data => setActivities(data))
      .catch(err => console.error('Gagal memuat aktivitas', err));
  }, []);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'operator'>('operator');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('http://127.0.0.1:8000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          onUpdateUsers(data);
        }
      } catch (e) {
        console.error('Failed to fetch users', e);
      }
    };
    fetchUsers();
  }, [onUpdateUsers]);

  const addActivity = useCallback((action: string, target: string) => {
    fetch('http://127.0.0.1:8000/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: loggedInUser.name,
        action,
        target,
      })
    })
      .then(res => res.json())
      .then(() => fetchActivities())
      .catch(err => console.error('Gagal menambah aktivitas', err));
  }, [loggedInUser.name, fetchActivities]);

  const openEditModal = (user: User) => {
    setEditUserId(user.id);
    setNewUserName(user.name);
    setNewUserEmail(user.email);
    setNewUserRole(user.role);
    setNewUserPassword('');
    setShowAddModal(true);
  };

  const handleToggleActive = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    });
    onUpdateUsers(updated);
  };

  const handleToggleSectorAssign = async (userId: string, sectorId: SectorId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const assigned = user.assignedSectors.includes(sectorId)
      ? user.assignedSectors.filter(id => id !== sectorId)
      : [...user.assignedSectors, sectorId];
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ assignedSectors: assigned })
      });
      if (response.ok) {
        const updated = users.map(u => u.id === userId ? { ...u, assignedSectors: assigned } : u);
        onUpdateUsers(updated);
        addActivity('Mengubah penugasan sektor untuk ' + user.name, 'system');
      }
    } catch (e) {
      console.error('Failed to update sector assignment', e);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserPassword && newUserPassword.length < 6) {
      alert("Password harus minimal 6 karakter!");
      return;
    }
    if (editUserId) {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(`http://127.0.0.1:8000/api/users/${editUserId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: newUserName, email: newUserEmail, role: newUserRole, password: newUserPassword })
        });
        if (response.ok) {
          const updatedUser = await response.json();
          const updated = users.map(u => u.id === editUserId ? { ...u, ...updatedUser } : u);
          onUpdateUsers(updated);
          addActivity('Mengedit pengguna ' + updatedUser.name, 'user');
        }
      } catch (err) {
        console.error("Failed to update user", err);
      }
    } else {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch('http://127.0.0.1:8000/api/users', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: newUserName, email: newUserEmail, role: newUserRole, password: newUserPassword })
        });
        if (response.ok) {
          const newUser = await response.json();
          onUpdateUsers([...users, { ...newUser, avatar: newUserName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(), assignedSectors: [], isActive: true, lastLogin: 'Belum pernah' }]);
          addActivity('Menambahkan pengguna ' + newUser.name, 'user');
        }
      } catch (err) {
        console.error("Failed to add user", err);
      }
    }
    setShowAddModal(false);
    setEditUserId(null);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('operator');
    setNewUserPassword('');
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(`http://127.0.0.1:8000/api/users/${userToDelete}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          onUpdateUsers(users.filter(u => u.id !== userToDelete));
          addActivity('Menghapus pengguna ID: ' + userToDelete, 'system');
        }
      } catch (err) {
        console.error("Failed to delete user", err);
      }
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderDashboard = () => {
    const alertSectors = sectors.filter(s => s.status === 'peringatan' || s.status === 'kritis').length;
    return (
      <div className="tab-dashboard">
        <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="admin-stat-card" style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Total Pengguna</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>{users.length}</p>
          </div>
          <div className="admin-stat-card" style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Sektor Aktif</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>{sectors.length}</p>
          </div>
          <div className="admin-stat-card" style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Alert Hari Ini</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>{alertSectors}</p>
          </div>
          <div className="admin-stat-card" style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>System Uptime</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>99.4%</p>
          </div>
        </div>

        <div className="dashboard-section" style={{ marginTop: '32px' }}>
          <h3 className="section-title" style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Status Sektor</h3>
          <div className="grid-sectors" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {sectors.map(sector => (
              <div key={sector.id} className="sector-card-mini" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: 24 }}>{sector.icon}</span>
                  <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>{sector.name}</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${STATUS_MAP[sector.status].cls}`}>
                    {STATUS_MAP[sector.status].label}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 400 }}>{sector.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px' }}>
          <div className="dashboard-section">
            <h3 className="section-title" style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Visualisasi Sektor Aktif</h3>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sectors.map(s => {
                const isWarning = s.status === 'peringatan';
                const color = isWarning ? '#f59e0b' : '#059669';
                const percent = isWarning ? 65 : Math.floor(Math.random() * 20) + 80;
                return (
                  <div key={s.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      <span>{s.name}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{percent}% Normal</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="dashboard-section">
            <h3 className="section-title" style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Aktivitas Terbaru</h3>
            <div className="activity-timeline" style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '20px' }}>
            {activities.slice(0, 5).map(activity => (
              <div key={activity.id} className="activity-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className={`activity-dot ${activity.type}`} style={{ width: '10px', height: '10px', borderRadius: '50%', background: activity.type === 'user' ? '#6366f1' : activity.type === 'system' ? '#f59e0b' : '#059669', flexShrink: 0 }} />
                <div className="activity-text" style={{ flex: 1, color: 'var(--text-primary)', fontSize: '14px' }}>{activity.action}</div>
                <div className="activity-time" style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>{activity.timestamp}</div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="tab-users">
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="search-box" style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}><IcSearch size={18} /></div>
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditUserId(null);
          setNewUserName('');
          setNewUserEmail('');
          setNewUserRole('operator');
          setNewUserPassword('');
          setShowAddModal(true);
        }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#059669', color: 'var(--text-primary)', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
          <IcUserPlus size={18} /> Tambah Pengguna
        </button>
      </div>

      <div className="admin-table-wrapper" style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pengguna</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sektor</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="user-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: user.role === 'admin' ? '#6366f1' : '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '16px' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-name" style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{user.name}</div>
                      <div className="user-email" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge badge-${user.role === 'admin' ? 'blue' : 'green'}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, background: user.role === 'admin' ? '#e0e7ff' : '#d1fae5', color: user.role === 'admin' ? '#4f46e5' : '#059669' }}>
                    {user.role === 'admin' ? 'Admin' : 'Operator'}
                  </span>
                </td>
                <td style={{ padding: '16px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', minHeight: '72px' }}>
                  {user.assignedSectors.map(sid => {
                    const sec = SECTORS.find(s => s.id === sid);
                    if (!sec) return null;
                    return (
                      <span key={sid} className="sector-tag" style={{ background: sec.colorLight, color: sec.color, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {sec.name}
                      </span>
                    );
                  })}
                  {user.assignedSectors.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>Tidak ada sektor</span>}
                </td>
                <td style={{ padding: '16px' }}>
                  <Toggle isOn={user.isActive} onChange={() => handleToggleActive(user.id)} />
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-sm btn-ghost" onClick={() => openEditModal(user)} style={{ padding: '6px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px' }} title="Edit"><IcEdit size={18} /></button>
                    <button className="btn-sm btn-ghost" style={{ padding: '6px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px' }} onClick={() => setUserToDelete(user.id)} title="Hapus"><IcTrash size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Tidak ada pengguna yang cocok dengan pencarian "{searchTerm}"
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="modal-sheet" style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{editUserId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}><IcX size={20} /></button>
            </div>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Nama Lengkap</label>
                <input required type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} placeholder="Masukkan nama pengguna" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Email</label>
                <input required type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} placeholder="nama@email.com" />
              </div>
              <div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Password {editUserId && '(Kosongkan jika tidak diubah)'}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewUserPassword ? "text" : "password"} value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', paddingRight: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} placeholder="••••••••" required={!editUserId} minLength={6} />
                    <button type="button" onClick={() => setShowNewUserPassword(!showNewUserPassword)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      {showNewUserPassword ? <IcEyeOff size={18} /> : <IcEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Role Akses</label>
                <input type="text" value={newUserRole === 'admin' ? 'Administrator (Super Admin)' : 'Operator Sektor'} disabled style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', outline: 'none', cursor: 'not-allowed' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost" style={{ padding: '10px 16px', background: 'var(--bg-base)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', background: '#059669', color: 'var(--text-primary)', borderRadius: '8px', border: 'none', fontWeight: 500, cursor: 'pointer' }}>Simpan Pengguna</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="modal-sheet" style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <IcTrash size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Hapus Pengguna?</h3>
            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>Tindakan ini tidak dapat dibatalkan. Pengguna akan kehilangan akses ke sistem secara permanen.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setUserToDelete(null)} className="btn btn-ghost" style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-base)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>Batal</button>
              <button onClick={confirmDeleteUser} className="btn btn-primary" style={{ flex: 1, padding: '10px 16px', background: '#ef4444', color: 'var(--text-primary)', borderRadius: '8px', border: 'none', fontWeight: 500, cursor: 'pointer' }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAssign = () => (
    <div className="tab-assign">
      <div className="assign-grid" style={{ overflowX: 'auto', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '16px', textAlign: 'left', minWidth: '240px', fontWeight: 600, color: 'var(--text-primary)' }}>Pengguna</th>
              {SECTORS.map(sec => (
                <th key={sec.id} style={{ padding: '16px', minWidth: '140px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ color: sec.color, padding: '8px', background: sec.colorLight, borderRadius: '50%', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>{sec.icon}</div>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{sec.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} style={{ borderBottom: index === users.length - 1 ? 'none' : '1px solid var(--border-color)', background: 'transparent' }}>
                <td style={{ padding: '16px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: user.role === 'admin' ? '#6366f1' : '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{user.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{user.role === 'admin' ? 'Admin' : 'Operator'}</div>
                    </div>
                  </div>
                </td>
                {SECTORS.map(sec => {
                  const isAssigned = user.assignedSectors.includes(sec.id);
                  return (
                    <td key={sec.id} style={{ padding: '16px' }}>
                      <button
                        className={`assign-checkbox ${isAssigned ? 'checked' : ''}`}
                        onClick={() => handleToggleSectorAssign(user.id, sec.id)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          border: `2px solid ${isAssigned ? '#10b981' : 'var(--border-color)'}`,
                          background: isAssigned ? '#10b981' : 'rgba(0,0,0,0.1)',
                          color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none',
                          boxShadow: isAssigned ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none'
                        }}
                        title={isAssigned ? `Hapus akses ${sec.name}` : `Beri akses ${sec.name}`}
                      >
                        {isAssigned && <IcCheck size={18} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="tab-activity">
      <div className="activity-timeline" style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '24px' }}>
        {activities.map((activity, index) => (
          <div key={activity.id} className="activity-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 0', borderBottom: index === activities.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
            <div className={`activity-dot ${activity.type || 'system'}`} style={{ width: '12px', height: '12px', borderRadius: '50%', background: activity.type === 'user' ? '#6366f1' : activity.type === 'system' ? '#f59e0b' : '#059669', marginTop: '4px', flexShrink: 0 }} />
            <div className="activity-text" style={{ flex: 1, color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.5' }}>
              <strong>{activity.user_name}</strong> {activity.action} <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{activity.target}</span>
            </div>
            <div className="activity-time" style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
              {new Date(activity.created_at).toLocaleString('id-ID')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="tab-settings">
      <SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} user={loggedInUser} onUpdateUser={onUpdateUser} />
    </div>
  );

  const TITLE_MAP: Record<AdminTab, { title: string, subtitle: string }> = {
    dashboard: { title: 'Dashboard Admin', subtitle: 'Ringkasan sistem dan status pertanian.' },
    users: { title: 'Kelola Pengguna', subtitle: 'Tambah, hapus, atau ubah status pengguna.' },
    assign: { title: 'Assign Sektor ke Pengguna', subtitle: 'Atur sektor mana yang dapat diakses oleh operator.' },
    activity: { title: 'Log Aktivitas', subtitle: 'Pantau aktivitas pengguna dan sistem terbaru.' },
    settings: { title: 'Pengaturan Sistem', subtitle: 'Konfigurasi parameter sistem dan notifikasi.' },
  };

  return (
    <div className="app-layout">
      <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar
          activeId={activeTab}
          onSelect={id => { 
            setActiveTab(id as AdminTab);
            setMobileMenuOpen(false);
          }}
          alertCount={0}
          unitAktif={sectors.length}
          onLogout={onLogout}
          isAdmin={true}
        />
      </div>

      <div className="app-main">
        <header className="app-header">
          <div className="mobile-header menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ cursor: 'pointer' }}>
            {mobileMenuOpen ? <IcX /> : <IcGrid />}
          </div>

          <div className="mobile-header mobile-brand">
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IcLeaf size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Smart Farming</span>
          </div>

          <div className="header-title">
            <div>{TITLE_MAP[activeTab].title}</div>
          </div>

          <div className="header-actions">
            <div className="date-time-wrapper" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <button onClick={() => setDarkMode(!darkMode)} style={{ position: 'relative', background: 'none', border: '1px solid var(--border-color)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.3s' }}>
              {darkMode ? <IcMoon size={18} /> : <IcSun size={18} />}
            </button>

            <div style={{ width: 1, height: 24, background: 'var(--border-color)' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
                {loggedInUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="header-user">
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{loggedInUser.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        <main className="app-content" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'assign' && renderAssign()}
          {activeTab === 'activity' && renderActivity()}
          {activeTab === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}
