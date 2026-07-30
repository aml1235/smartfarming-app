import React, { useState, useEffect, useRef } from 'react';
import {
  IcLeaf, IcShield, IcActivity, IcZap, IcBarChart, IcUsers, IcGrid, IcBell, IcWaves, IcDroplets, IcSettings, IcLink, IcHome, IcSun, IcMoon, IcMail
} from './Icons';

interface LandingPageProps {
  onLogin: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

function useVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const FloatingOrb = ({ style, delay = '0s' }: { style: React.CSSProperties, delay?: string }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none', animation: `float 6s ease-in-out infinite ${delay}`, ...style }} />
);

const DewParticles = () => {
  return (
    <>
      <style>{`
        @keyframes flyUp {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
        .dew-particle {
          position: absolute;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(59, 130, 246, 0.1));
          border-radius: 50%;
          pointer-events: none;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
          z-index: 10;
        }
        [data-theme='dark'] .dew-particle {
          background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.1));
          box-shadow: 0 0 10px rgba(255,255,255,0.3);
        }
      `}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        {[...Array(20)].map((_, i) => {
          const size = Math.random() * 8 + 3;
          const left = Math.random() * 100;
          const delay = Math.random() * 15;
          const duration = Math.random() * 10 + 10;
          return (
            <div
              key={i}
              className="dew-particle"
              style={{
                width: size, height: size, left: `${left}%`,
                animation: `flyUp ${duration}s linear ${delay}s infinite`
              }}
            />
          );
        })}
      </div>
    </>
  );
};

const AnimatedCounter = ({ endValue, suffix = '', decimals = 0 }: { endValue: number; suffix?: string; decimals?: number }) => {
  const [count, setCount] = useState(0);
  const { ref, visible } = useVisible(0.5);

  useEffect(() => {
    if (!visible) return;
    let startTime: number | null = null;
    const duration = 2200;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * endValue);
      if (progress < 1) window.requestAnimationFrame(step);
      else setCount(endValue);
    };
    window.requestAnimationFrame(step);
  }, [endValue, visible]);

  return <span ref={ref}>{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}</span>;
};

export function LandingPage({ onLogin, darkMode, setDarkMode }: LandingPageProps) {
  const heroAnim = useVisible(0.1);
  const sectorsAnim = useVisible(0.1);
  const featuresAnim = useVisible(0.1);
  const stepsAnim = useVisible(0.1);
  const ctaAnim = useVisible(0.1);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sectors = [
    { icon: <IcHome size={28} />, title: 'Kandang Ayam', subtitle: 'Poultry Management', desc: 'Sistem monitoring lingkungan kandang ayam secara otomatis.', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    { icon: <IcLeaf size={28} />, title: 'Hidroponik', subtitle: 'Hydroponic System', desc: 'Pengelolaan sistem pertanian tanpa tanah dengan pemantauan nutrisi.', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    { icon: <IcWaves size={28} />, title: 'Kolam Ikan', subtitle: 'Aquaculture System', desc: 'Pemantauan kualitas air kolam secara kontinu.', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
    { icon: <IcDroplets size={28} />, title: 'Irigasi Tanah', subtitle: 'Soil Irrigation', desc: 'Pengelolaan irigasi berbasis data sensor kelembapan.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
  ];

  const features = [
    { icon: <IcActivity />, title: 'Monitoring Real-Time', desc: 'Pantau kondisi semua sektor secara langsung.' },
    { icon: <IcZap />, title: 'Otomasi Cerdas', desc: 'Sistem bereaksi otomatis terhadap kondisi abnormal.' },
    { icon: <IcBell />, title: 'Notifikasi Peringatan', desc: 'Alert berbasis threshold yang dapat dikonfigurasi.' },
    { icon: <IcBarChart />, title: 'Analitik & Histori', desc: 'Grafik tren historis untuk mengambil keputusan berdasarkan data.' },
    { icon: <IcUsers />, title: 'Manajemen Tim', desc: 'Pendelegasian tugas yang efisien.' },
    { icon: <IcGrid />, title: 'Multi-Perangkat', desc: 'Antarmuka responsif yang bekerja sempurna di desktop dan ponsel.' },
  ];

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="landing-page" style={{ position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        .landing-page { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); min-height: 100vh; }
        [data-theme='dark'] .landing-page { background: var(--bg-base); }
      `}</style>
      <DewParticles />
      {/* BACKGROUND ORBS */}
      <FloatingOrb style={{ top: -100, left: -100, width: 400, height: 400, background: '#10b981' }} delay="0s" />
      <FloatingOrb style={{ top: '20%', right: -150, width: 500, height: 500, background: '#3b82f6' }} delay="-2s" />
      <FloatingOrb style={{ top: '60%', left: -200, width: 600, height: 600, background: '#8b5cf6', opacity: 0.1 }} delay="-4s" />

      {/* NAVBAR */}
      <nav className="landing-nav" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
            <div style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: '10px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IcLeaf size={isMobile ? 16 : 18} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: isMobile ? '1.1rem' : '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Smart Farming</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px', flexWrap: 'wrap' }}>
            {!isMobile && (
              <div style={{ display: 'flex', gap: '20px', marginRight: '10px' }}>
                <button onClick={() => scrollTo('sektor')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>Sektor</button>
                <button onClick={() => scrollTo('fitur')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>Fitur</button>
                <button onClick={() => scrollTo('cara-kerja')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>Cara Kerja</button>
              </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', borderRadius: '50%', width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', transition: 'all 0.3s' }}>
              {darkMode ? <IcMoon size={isMobile ? 18 : 20} /> : <IcSun size={isMobile ? 18 : 20} />}
            </button>
            <button className="btn btn-primary" onClick={onLogin} style={{ padding: isMobile ? '8px 16px' : '10px 24px', borderRadius: '999px', fontSize: isMobile ? '0.9rem' : '1rem' }}>{isMobile ? 'Masuk' : 'Masuk Dashboard'}</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        
        {/* HERO */}
        <div ref={heroAnim.ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center', padding: isMobile ? '60px 0' : '100px 0', opacity: heroAnim.visible ? 1 : 0, transform: heroAnim.visible ? 'translateY(0)' : 'translateY(40px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="hero-copy" style={{ zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 700, marginBottom: '24px', fontSize: '14px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ animation: 'pulse-glow 2s infinite' }}><IcLeaf size={16} /></div>
              Sistem Terpadu Generasi Baru
            </div>
            <h1 style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', lineHeight: 1.1, marginBottom: '24px', color: 'var(--text-primary)', fontWeight: 900, letterSpacing: '-0.03em' }}>
              Monitoring <span style={{ background: 'linear-gradient(135deg, #059669, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pertanian Cerdas</span> untuk Produksi Optimal
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.7, maxWidth: 480 }}>
              Tingkatkan efisiensi produksi dan kelola empat sektor pertanian Anda dari satu dashboard terpadu berbasis IoT.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '56px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={onLogin} style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: '12px' }}>Mulai Sekarang</button>

              <a href="/SmartFarming.apk" download="SmartFarming.apk" className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: '12px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                Unduh APK Android
              </a>
            </div>
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}><AnimatedCounter endValue={4} suffix="+" /></span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sektor Aktif</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}><AnimatedCounter endValue={99.4} suffix="%" decimals={1} /></span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Uptime Sistem</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 2 }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, background: 'linear-gradient(135deg, #10b981, transparent)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.2, zIndex: 0 }} />
            
            {[
              { icon: <IcBarChart />, title: 'Monitoring Real-time', desc: 'Pantau suhu, kelembapan, pH dari satu dashboard terpadu.', color: '#10b981', delay: '0.1s' },
              { icon: <IcShield />, title: 'Keamanan & Kontrol', desc: 'Akses sistem diatur secara ketat hanya untuk personel berwenang.', color: '#3b82f6', delay: '0.2s', isAccent: true },
              { icon: <IcGrid />, title: 'Multi-Perangkat', desc: 'Responsif di desktop, tablet, dan ponsel.', color: '#8b5cf6', delay: '0.3s' }
            ].map((card, i) => (
              <div key={i} style={{
                position: 'relative', zIndex: 1, padding: '28px', borderRadius: '20px', 
                background: card.isAccent ? `rgba(59,130,246,0.08)` : 'var(--bg-surface)', 
                border: `1px solid ${card.isAccent ? 'rgba(59,130,246,0.2)' : 'var(--border-color)'}`, 
                boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
                opacity: heroAnim.visible ? 1 : 0, transform: heroAnim.visible ? 'translateY(0)' : 'translateY(20px)', 
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${card.delay}`
              }}>
                <div style={{ marginBottom: '16px', color: card.color, display: 'inline-flex', padding: '12px', borderRadius: '12px', background: `${card.color}15` }}>{card.icon}</div>
                <h3 style={{ marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>{card.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SEKTOR PERTANIAN */}
        <section id="sektor" ref={sectorsAnim.ref} style={{ padding: '80px 0', opacity: sectorsAnim.visible ? 1 : 0, transform: sectorsAnim.visible ? 'translateY(0)' : 'translateY(40px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '999px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 700, fontSize: '13px', marginBottom: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>Empat Pilar Sistem</div>
            <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>Satu Platform, Semua Sektor</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>Setiap sektor pertanian dimonitor dengan parameter yang disesuaikan untuk kebutuhan biologis dan target produksinya.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? '16px' : '32px' }}>
            {sectors.map((s, i) => (
              <div key={s.title} style={{
                padding: isMobile ? '20px' : '32px', borderRadius: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderTop: `4px solid ${s.color}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: sectorsAnim.visible ? 1 : 0, transform: sectorsAnim.visible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${i * 0.1}s`
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 40px ${s.color}15`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '16px', background: s.bg, border: `1px solid ${s.border}`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.title}</h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.subtitle}</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FITUR UNGGULAN */}
        <section id="fitur" ref={featuresAnim.ref} style={{ padding: '80px 0', opacity: featuresAnim.visible ? 1 : 0, transform: featuresAnim.visible ? 'translateY(0)' : 'translateY(40px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>Fitur Unggulan Sistem</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>Dibekali dengan teknologi mutakhir untuk memberikan Anda kendali penuh.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {features.map((f, i) => (
              <div key={f.title} style={{
                padding: '36px', borderRadius: '24px', position: 'relative', overflow: 'hidden',
                backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.3s ease',
                opacity: featuresAnim.visible ? 1 : 0, transform: featuresAnim.visible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${i * 0.1}s`
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(16,185,129,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)'; }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', borderRadius: '0 24px 0 100%' }} />
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669', marginBottom: '24px' }}>{f.icon}</div>
                <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CARA KERJA SISTEM */}
        <section id="cara-kerja" ref={stepsAnim.ref} style={{ padding: '80px 0', opacity: stepsAnim.visible ? 1 : 0, transform: stepsAnim.visible ? 'translateY(0)' : 'translateY(40px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '999px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#2563eb', fontWeight: 700, fontSize: '13px', marginBottom: '20px', border: '1px solid rgba(59,130,246,0.2)' }}>Alur Data Cerdas</div>
            <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>Dari Sensor ke Keputusan</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>Arsitektur yang sederhana namun sangat bertenaga, mengirim insight langsung ke layar Anda.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', position: 'relative' }}>
            {!isMobile && (
              <div style={{ position: 'absolute', top: '40px', left: '12.5%', right: '12.5%', height: '2px', background: 'linear-gradient(90deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2))', zIndex: 0 }}>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #10b981, #3b82f6)', animation: 'shimmer 3s infinite linear', backgroundSize: '200% 100%' }} />
              </div>
            )}
            
            {[
              { step: '01', icon: <IcActivity size={32} />, title: 'Sensor Lapangan', desc: 'Perangkat IoT mengukur parameter fisik real-time.', color: '#10b981' },
              { step: '02', icon: <IcLink size={32} />, title: 'Transmisi Data', desc: 'Data dikirim secara aman ke server cloud.', color: '#0ea5e9' },
              { step: '03', icon: <IcSettings size={32} />, title: 'Analisis Cerdas', desc: 'Algoritma mendeteksi anomali.', color: '#3b82f6' },
              { step: '04', icon: <IcGrid size={32} />, title: 'Visualisasi', desc: 'Insight disajikan dalam dashboard visual.', color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={s.step} style={{ 
                position: 'relative', zIndex: 1, textAlign: 'center',
                opacity: stepsAnim.visible ? 1 : 0, transform: stepsAnim.visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s`
              }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', 
                  background: 'var(--bg-surface)', border: '2px solid var(--border-color)', 
                  color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: `0 8px 24px ${s.color}15`, position: 'relative', transition: 'transform 0.3s ease'
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'}
                >
                  {s.icon}
                  <div style={{ position: 'absolute', top: -5, right: -5, width: 28, height: 28, borderRadius: '50%', background: s.color, color: '#fff', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg-surface)' }}>{s.step}</div>
                </div>
                <h4 style={{ margin: '0 0 12px', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{s.title}</h4>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section ref={ctaAnim.ref} style={{ 
          margin: '40px 0 80px', padding: isMobile ? '40px 20px' : '80px 40px', borderRadius: '32px', 
          background: 'linear-gradient(135deg, #022c22, #065f46, #047857)', textAlign: 'center', position: 'relative', overflow: 'hidden',
          opacity: ctaAnim.visible ? 1 : 0, transform: ctaAnim.visible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 24px 48px rgba(6,95,70,0.2)'
        }}>
          <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: '#34d399', opacity: 0.15, top: -250, right: -200, filter: 'blur(80px)', pointerEvents: 'none', animation: 'float 8s infinite' }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: '#3b82f6', opacity: 0.15, bottom: -200, left: -150, filter: 'blur(80px)', pointerEvents: 'none', animation: 'float 6s infinite reverse' }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: '#fff', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '50%', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}><IcLeaf size={48} /></div>
            </div>
            <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 24px', letterSpacing: '-0.02em' }}>Siap Memantau Pertanian Anda?</h2>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.85)', marginBottom: '48px', maxWidth: 540, margin: '0 auto 48px', lineHeight: 1.7 }}>
              Jadilah bagian dari masa depan agrikultur. Kelola semua sektor pertanian Anda secara cerdas, otomatis, dan real-time.
            </p>
            <button onClick={onLogin} style={{ 
              padding: '18px 48px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: '#fff', color: '#047857', fontWeight: 800, fontSize: '1.1rem', 
              boxShadow: '0 12px 32px rgba(0,0,0,0.2)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', display: 'inline-flex', alignItems: 'center', gap: '12px' 
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)'; }}
            >
              Masuk ke Dashboard Sekarang
            </button>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <footer style={{ padding: isMobile ? '40px 16px' : '40px 40px', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-surface)', zIndex: 1, position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start', gap: '30px', textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: isMobile ? 'center' : 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              <IcLeaf size={20} color="#10b981" /> Smart Farming
            </div>
            <div style={{ fontSize: '0.85rem', maxWidth: '250px' }}>
              Platform monitoring pertanian cerdas berbasis IoT terpadu.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: isMobile ? 'center' : 'flex-start' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Hubungi Kami</div>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="mailto:amelkartika120305@gmail.com" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IcMail size={16} /> amelkartika120305@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '1000px', margin: '40px auto 0', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', flexDirection: isMobile ? 'column' : 'row' }}>
          <div>© 2026 Hak cipta dilindungi.</div>
          <div style={{ opacity: 0.5, fontStyle: 'italic' }}>Dikembangkan oleh Kadet Informatika Universitas Pertahanan RI</div>
        </div>
      </footer>
    </div>
  );
}

