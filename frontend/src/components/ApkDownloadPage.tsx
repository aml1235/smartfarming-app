import React from 'react';
import { IcLeaf, IcDownload, IcStar, IcShield } from './Icons';

interface ApkDownloadPageProps {
  onBack: () => void;
}

export function ApkDownloadPage({ onBack }: ApkDownloadPageProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)', marginRight: '24px' }}>
          ←
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg viewBox="0 0 40 40" width="32" height="32">
            <path d="M19.7,3 L6,14.6 L20,38 L34,14.6 Z" fill="#34A853" />
            <path d="M19.7,3 L34,14.6 L20,25 Z" fill="#4285F4" />
            <path d="M6,14.6 L20,25 L20,38 Z" fill="#EA4335" />
            <path d="M6,14.6 L19.7,3 L20,25 Z" fill="#FBBC05" />
          </svg>
          <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Google Play</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', paddingTop: '40px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* App Icon */}
          <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(16,185,129,0.3)', flexShrink: 0 }}>
            <IcLeaf size={64} color="#fff" />
          </div>
          
          {/* App Info */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Smart Farming Indonesia</h1>
            <div style={{ fontSize: '1rem', color: '#059669', fontWeight: 600, marginBottom: '16px' }}>Kadet Informatika Universitas Pertahanan RI</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Berisi Iklan · Pembelian Dalam Aplikasi</div>
            
            <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  4.9 <IcStar size={16} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>12 rb ulasan</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>100 rb+</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Download</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ border: '1px solid var(--text-primary)', borderRadius: '4px', padding: '0 4px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'inline-block', marginBottom: '2px' }}>3+</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rating 3+</div>
              </div>
            </div>

            <a href="/SmartFarming.apk" download="SmartFarming.apk" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#059669', color: '#fff', textDecoration: 'none', padding: '12px 32px', borderRadius: '999px', fontWeight: 600, fontSize: '1.1rem', transition: 'background 0.2s', width: '100%', maxWidth: '300px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#047857'} onMouseLeave={(e) => e.currentTarget.style.background = '#059669'}>
              Instal APK
            </a>
          </div>
        </div>

        {/* Screenshots Placeholder */}
        <div style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Tentang aplikasi ini</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
            Tingkatkan efisiensi produksi dan kelola sektor pertanian Anda dari satu genggaman dengan aplikasi Smart Farming. Sistem monitoring terpadu berbasis IoT yang dirancang khusus untuk memenuhi kebutuhan pertanian modern di Indonesia. Pantau parameter krusial seperti suhu, kelembapan, intensitas cahaya, level air, dan pH secara real-time.
          </p>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Keamanan Data</h2>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', background: 'var(--bg-surface)' }}>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Keamanan dimulai dengan memahami cara developer mengumpulkan dan membagikan data Anda. Praktik privasi dan keamanan data mungkin berbeda-beda berdasarkan penggunaan, wilayah, dan usia Anda.</p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--text-primary)', marginBottom: '12px' }}>
              <div style={{ padding: '8px', background: 'rgba(5,150,105,0.1)', borderRadius: '50%', color: '#059669' }}>
                <IcShield />
              </div>
              <div>Data tidak dibagikan kepada pihak ketiga</div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--text-primary)' }}>
              <div style={{ padding: '8px', background: 'rgba(5,150,105,0.1)', borderRadius: '50%', color: '#059669' }}>
                <IcDownload />
              </div>
              <div>Data dienkripsi dalam perjalanan</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
