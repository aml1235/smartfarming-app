import React, { useState, useEffect } from 'react'
import { IcChevronRight, IcEye, IcEyeOff } from './Icons'

interface SettingsProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  user: any;
  onUpdateUser: (user: any) => void;
}

const AccordionSection = ({ 
  id, title, desc, children, openSection, toggleSection 
}: { 
  id: string, title: string, desc: string, children: React.ReactNode, 
  openSection: string | null, toggleSection: (id: string) => void 
}) => {
  const isOpen = openSection === id;
  return (
    <div className="settings-card" style={{ marginBottom: 20, cursor: 'pointer', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', transition: 'all 0.3s' }} onClick={() => toggleSection(id)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="settings-card-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          <div className="settings-card-desc" style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{desc}</div>
        </div>
        <div style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: 'var(--text-secondary)', background: 'var(--bg-base)', padding: '8px', borderRadius: '50%' }}>
          <IcChevronRight size={20} />
        </div>
      </div>
      
      <div style={{ display: isOpen ? 'block' : 'none', borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 16 }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function SettingsPage({ darkMode, setDarkMode, user, onUpdateUser }: SettingsProps) {
  const [openSection, setOpenSection] = useState<string | null>('profile')

  // Profile form state
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user?.id])

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id)
  }

  const logActivity = (action: string) => {
    fetch('http://127.0.0.1:8000/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: user?.name || 'User',
        action,
        target: 'Pengaturan Akun'
      })
    }).catch(err => console.error(err));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg(data.message || 'Profil berhasil diperbarui');
        onUpdateUser(data.user);
        logActivity('mengubah profil diri sendiri');
      } else {
        setProfileMsg(data.message || data.email?.[0] || 'Gagal memperbarui profil');
      }
    } catch (err: any) {
      console.error(err);
      setProfileMsg('Kesalahan sistem: ' + (err.message || 'Gagal tersambung'));
    }
    setProfileLoading(false);
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Password baru dan konfirmasi tidak cocok');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Password baru harus minimal 6 karakter');
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          current_password: currentPassword, 
          new_password: newPassword, 
          new_password_confirmation: confirmPassword 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg('Password berhasil diperbarui');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        logActivity('mengganti password akun');
      } else {
        setPasswordMsg(data.message || data.errors?.current_password?.[0] || data.errors?.new_password?.[0] || 'Gagal mengubah password');
      }
    } catch (err: any) {
      console.error(err);
      setPasswordMsg('Kesalahan sistem: ' + (err.message || 'Gagal tersambung'));
    }
    setPasswordLoading(false);
  }

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' };


  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Pengaturan Akun</h2>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      <div style={{ maxWidth: 800 }}>
        {/* Profile */}
        <AccordionSection id="profile" title="Edit Profil" desc="Perbarui nama dan alamat email Anda" openSection={openSection} toggleSection={toggleSection}>
          {profileMsg && (
            <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '12px', background: profileMsg.includes('berhasil') ? '#dcfce7' : '#fee2e2', color: profileMsg.includes('berhasil') ? '#059669' : '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {profileMsg}
            </div>
          )}
          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Nama Lengkap</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder={user?.name} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Alamat Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder={user?.email} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }} disabled={profileLoading}>
                {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </AccordionSection>

        {/* Password */}
        <AccordionSection id="password" title="Ganti Password" desc="Tingkatkan keamanan dengan memperbarui password Anda" openSection={openSection} toggleSection={toggleSection}>
          {passwordMsg && (
            <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '12px', background: passwordMsg.includes('berhasil') ? '#dcfce7' : '#fee2e2', color: passwordMsg.includes('berhasil') ? '#059669' : '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {passwordMsg}
            </div>
          )}
          <form onSubmit={handleUpdatePassword}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password Lama</label>
              <div style={{ position: 'relative' }}>
                <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{...inputStyle, paddingRight: 48}} required />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showCurrentPassword ? <IcEyeOff size={18} /> : <IcEye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{...inputStyle, paddingRight: 48}} required minLength={6} />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showNewPassword ? <IcEyeOff size={18} /> : <IcEye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Konfirmasi Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 40 }} required minLength={6} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {showConfirmPassword ? <IcEyeOff size={18} /> : <IcEye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }} disabled={passwordLoading}>
                {passwordLoading ? 'Menyimpan...' : 'Perbarui Password'}
              </button>
            </div>
          </form>
        </AccordionSection>
      </div>
    </div>
  )
}
