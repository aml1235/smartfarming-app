import React from 'react'
import { Sector, SectorId } from '../types'
import { STATUS_MAP } from '../constants'
import { ProgressBar } from './UIComponents'
import { IcCheck, IcChevronRight } from './Icons'

export function OverviewMetrics({ id }: { id: SectorId }) {
  const metrics: Record<SectorId, React.ReactNode> = {
    kandang: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
            <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Suhu</div>
            <div className="metric-box-val" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: '#E65100', marginTop: 1 }}>28.4°C</div>
          </div>
          <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
            <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Kelembapan</div>
            <div className="metric-box-val" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: '#1565C0', marginTop: 1 }}>65%</div>
          </div>
        </div>
        <div>
          <div className="metric-row-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <span>🌾 Pakan</span><span style={{ fontWeight: 600, color: '#795548' }}>58%</span>
          </div>
          <ProgressBar value={58} color="#795548" />
        </div>
        <div>
          <div className="metric-row-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <span>💧 Air Minum</span><span style={{ fontWeight: 600, color: '#1565C0' }}>72%</span>
          </div>
          <ProgressBar value={72} color="#1565C0" />
        </div>
      </div>
    ),
    kolam: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px 0' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, fontStyle: 'italic' }}>Dalam Pengembangan Saja Dulu</div>
      </div>
    ),
    hidroponik: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
            <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Level Air</div>
            <div className="metric-box-val" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: '#1565C0', marginTop: 1 }}>85%</div>
          </div>
          <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
            <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Suhu Air</div>
            <div className="metric-box-val" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: '#E65100', marginTop: 1 }}>27°C</div>
          </div>
        </div>
        <div>
          <div className="metric-row-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <span>🌊 Kapasitas Tangki</span><span style={{ fontWeight: 600, color: '#1565C0' }}>85%</span>
          </div>
          <ProgressBar value={85} color="#1565C0" />
        </div>
      </div>
    ),
    irigasi: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px 0' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, fontStyle: 'italic' }}>Dalam Pengembangan Saja Dulu</div>
      </div>
    ),
  }
  return metrics[id]
}

export function SectorCard({ sector, onOpen }: { sector: Sector & { metrics: React.ReactNode }; onOpen: () => void }) {
  const { label, cls } = STATUS_MAP[sector.status]
  return (
    <div className="card card-clickable fade-up" onClick={onOpen} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 4, background: sector.color }} />
      <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: sector.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
            {sector.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{sector.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{sector.unit}</div>
          </div>
        </div>
        <div className={`badge ${cls}`}>{label}</div>
      </div>
      <div style={{ padding: '0 20px 16px', flex: 1 }}>
        {sector.metrics}
      </div>
      <div className="card-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Diperbarui {sector.lastUpdate}</span>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: 'none', background: sector.colorLight, color: sector.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
          onClick={e => { e.stopPropagation(); onOpen() }}
        >
          Kelola <IcChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
