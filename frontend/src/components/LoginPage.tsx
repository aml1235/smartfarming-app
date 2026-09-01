import { API_URL } from '../constants'
import React, { useState, useEffect } from 'react';
import { IcLeaf, IcArrowLeft, IcEye, IcEyeOff } from './Icons';

interface LoginPageProps {
  onLogin: (user: any) => void;
  onBack: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(() => {
    const t = localStorage.getItem('loginUnlockTime');
    if (t) {
      const r = Math.floor((parseInt(t, 10) - Date.now()) / 1000);
      return r > 0 ? r : 0;
    }
    return 0;
  });

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => window.clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('token') && params.has('email')) {
      setView('reset');
      setEmail(params.get('email') || '');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        setCountdown(seconds);
        localStorage.setItem('loginUnlockTime', (Date.now() + seconds * 1000).toString());
        setMessage(`Terlalu banyak percobaan. Silakan coba lagi dalam ${seconds} detik.`);
      } else if (response.ok) {
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      } else {
        setMessage(data.message || data.email?.[0] || 'Login gagal');
      }
    } catch {
      setMessage('Terjadi kesalahan jaringan');
    }
    setIsLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        setCountdown(seconds);
        localStorage.setItem('loginUnlockTime', (Date.now() + seconds * 1000).toString());
        setMessage(`Terlalu banyak percobaan. Silakan coba lagi dalam ${seconds} detik.`);
      } else if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.message || data.email?.[0] || 'Gagal memproses permintaan');
      }
    } catch {
      setMessage('Terjadi kesalahan jaringan');
    }
    setIsLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setMessage('Konfirmasi password tidak cocok');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          password, 
          password_confirmation: passwordConfirmation, 
          token: params.get('token') 
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Password berhasil diubah. Silakan login.');
        setTimeout(() => {
          window.location.href = '/'; // clear query params
        }, 2000);
      } else {
        setMessage(data.message || 'Gagal mengubah password');
      }
    } catch {
      setMessage('Terjadi kesalahan jaringan');
    }
    setIsLoading(false);
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', position: 'relative', overflow: 'hidden' }}>
      <div className="landing-particles">
        <div className="particle"></div><div className="particle"></div><div className="particle"></div>
        <div className="particle"></div><div className="particle"></div><div className="particle"></div>
      </div>

      <div className="login-card" style={{ maxWidth: '400px', width: '100%', margin: '0 auto', padding: '40px', background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', zIndex: 10, position: 'relative' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}>
            <IcLeaf color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Smart Farming</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{view === 'login' ? 'Masuk ke platform monitoring' : view === 'forgot' ? 'Atur ulang password Anda' : 'Buat password baru'}</p>
        </div>

        {message && (
          <div style={{ padding: '10px', marginBottom: '20px', borderRadius: '8px', background: message.includes('Berhasil') || message.includes('dikirim') ? '#dcfce7' : '#fee2e2', color: message.includes('Berhasil') || message.includes('dikirim') ? '#059669' : '#dc2626', fontSize: '0.875rem', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {view === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Email</label>
              <input 
                type="email" 
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid #d1d5db', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                <button type="button" onClick={() => { setView('forgot'); setMessage(''); }} style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Lupa Password?</button>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid #d1d5db', color: 'var(--text-primary)', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPassword ? <IcEyeOff size={18} /> : <IcEye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', fontWeight: 600, cursor: (isLoading || countdown > 0) ? 'not-allowed' : 'pointer', opacity: (isLoading || countdown > 0) ? 0.7 : 1 }} disabled={isLoading || countdown > 0}>
              {isLoading ? 'Memproses...' : countdown > 0 ? `Tunggu ${countdown}s` : 'Masuk'}
            </button>
          </form>
        ) : view === 'forgot' ? (
          <form onSubmit={handleForgot}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Email yang terdaftar</label>
              <input 
                type="email" 
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid #d1d5db', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', fontWeight: 600, cursor: (isLoading || countdown > 0) ? 'not-allowed' : 'pointer', opacity: (isLoading || countdown > 0) ? 0.7 : 1 }} disabled={isLoading || countdown > 0}>
              {isLoading ? 'Mengirim...' : countdown > 0 ? `Tunggu ${countdown}s` : 'Kirim Link Reset'}
            </button>
            <button type="button" onClick={() => setView('login')} style={{ width: '100%', padding: '12px', marginTop: '12px', borderRadius: '8px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>
              Kembali ke Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Email</label>
              <input 
                type="email" 
                value={email}
                disabled
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid #d1d5db', color: '#6b7280', outline: 'none', cursor: 'not-allowed' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid #d1d5db', color: 'var(--text-primary)', outline: 'none', paddingRight: '40px' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <IcEyeOff /> : <IcEye />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Konfirmasi Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid #d1d5db', color: 'var(--text-primary)', outline: 'none', paddingRight: '40px' }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showConfirmPassword ? <IcEyeOff /> : <IcEye />}
                </button>
              </div>
              {password && passwordConfirmation && password !== passwordConfirmation && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>Konfirmasi password tidak cocok dengan password baru.</div>
              )}
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, marginBottom: '12px' }} disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Ubah Password'}
            </button>
            <button type="button" onClick={() => window.location.href = '/'} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>
              Batal
            </button>
          </form>
        )}

        {view === 'login' && (
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%', marginTop: '24px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem' }}>
            <IcArrowLeft /> Kembali ke beranda
          </button>
        )}
      </div>
    </div>
  );
}



