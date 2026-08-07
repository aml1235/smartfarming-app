import { useState, useEffect } from 'react'
import { API_URL } from '../constants'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Sector, SectorId } from '../types'
import { Toggle, ProgressBar, TempGauge, StatCard, ChartTooltip } from './UIComponents'
import { IcArrowLeft, IcRefresh, IcCheck, IcDroplets, IcThermometer, IcActivity, IcX, IcPlus } from './Icons'

export function AddSectorModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, type: string) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('kandang')

  const types = [
    { value: 'kandang', label: 'Kandang Ayam', icon: '🐓' },
    { value: 'kolam', label: 'Kolam Ikan', icon: '🐟' },
    { value: 'hidroponik', label: 'Hidroponik', icon: '🌿' },
    { value: 'irigasi', label: 'Irigasi Tanah', icon: '🌱' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 480, marginTop: 80 }} onClick={e => e.stopPropagation()}>
        <div style={{ background: '#2E7D32', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Tambah Unit Baru</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 2 }}>Tambah Sektor</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <IcX />
          </button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nama Sektor</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="contoh: Kandang Ayam Unit 2" style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Tipe Sektor</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {types.map(t => (
                <button key={t.value} onClick={() => setType(t.value)} style={{ padding: '10px 14px', borderRadius: 8, border: `2px solid ${type === t.value ? '#2E7D32' : '#e4e7ec'}`, background: type === t.value ? '#dcf0de' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: type === t.value ? '#2E7D32' : '#374151' }}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: 'var(--bg-surface)', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--text-secondary)' }}>Batal</button>
            <button onClick={() => { if (name.trim()) { onAdd(name.trim(), type); onClose() } }} disabled={!name.trim()} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: name.trim() ? '#2E7D32' : '#9CA3AF', fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IcPlus /> Tambah Sektor
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


import { SectorDashboard } from './SectorDashboard'

export function KandangDetail({ sector, onBack }: { sector: Sector; onBack: () => void }) {
  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-sheet" style={{ maxWidth: 1000, width: '90%' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid #e4e7ec', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #e4e7ec', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Kembali
          </button>
        </div>
        <div style={{ padding: 20, maxHeight: 'calc(90vh - 70px)', overflowY: 'auto' }}>
           <SectorDashboard sector={sector} />
        </div>
      </div>
    </div>
  )
}

export function GenericDetail({ sector, onBack }: { sector: Sector; onBack: () => void }) {
  const [pump, setPump] = useState(true)
  const [auto, setAuto] = useState(true)
  
  const [hydroData, setHydroData] = useState({ waterLevel: 0, temp: 0, humidity: 0, light: 0, pumpStatus: 'OFF' })

  useEffect(() => {
    const isHydro = String(sector.id).toLowerCase().includes('sec-010') || String(sector.id).toLowerCase().includes('hidro');
    if (isHydro) {
      const fetchData = async () => {
        try {
          const res = await fetch(`${API_URL}/api/sectors/${sector.id}/logs`)
          const data = await res.json()
          if (data && data.length > 0) {
             const latest = data[data.length - 1]
             setHydroData({
               waterLevel: latest.waterLevel || latest.water_level || 0,
               temp: latest.temperature || 0,
               humidity: latest.humidity || 0,
               light: latest.lightLevel || latest.light_level || 0,
               pumpStatus: latest.pumpStatus || latest.pump_status || 'OFF'
             })
          }
        } catch (e) {
          console.error(e)
        }
      }
      fetchData()
      const interval = setInterval(fetchData, 10000)
      return () => clearInterval(interval)
    }
  }, [sector.id])

  const handlePumpChange = async (newState: boolean) => {
    setPump(newState)
    try {
      await fetch(`${API_URL}/api/sector/${sector.id}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: newState ? 'ON' : 'OFF' })
      })
    } catch (e) {
      console.error(e)
    }
  }

  const configs: Record<SectorId, { metrics: { label: string; value: string; color: string }[]; ctrl1: string; ctrl2: string }> = {
    kandang: { metrics: [], ctrl1: '', ctrl2: '' },
    kolam: {
      metrics: [
        { label: 'pH Air', value: '0', color: '#1565C0' },
        { label: 'Suhu Air', value: '0°C', color: '#E65100' },
        { label: 'Kekeruhan', value: '-', color: '#2E7D32' },
        { label: 'Oksigen Terlarut', value: '0 mg/L', color: '#2E7D32' },
      ],
      ctrl1: 'Aerator Kolam', ctrl2: 'Pompa Sirkulasi',
    },
    hidroponik: {
      metrics: [
        { label: 'Suhu', value: `${hydroData.temp}°C`, color: '#E65100' },
        { label: 'Kelembapan', value: `${hydroData.humidity}%`, color: '#1565C0' },
        { label: 'Intensitas Cahaya', value: `${hydroData.light} lux`, color: '#F59E0B' },
        { label: 'Level Air', value: `${hydroData.waterLevel}%`, color: '#1565C0' },
      ],
      ctrl1: 'Pompa Sirkulasi', ctrl2: '',
    },
    irigasi: {
      metrics: [
        { label: 'Kelembapan Tanah', value: '0%', color: '#E65100' },
        { label: 'Status', value: '-', color: '#C62828' },
        { label: 'Lahan Total', value: '0 Ha', color: 'var(--text-secondary)' },
        { label: 'Terakhir Irigasi', value: '-', color: '#6B7280' },
      ],
      ctrl1: 'Sprinkler Otomatis', ctrl2: 'Irigasi Tetes',
    },
  }
  const effectiveId = String(sector.id).toLowerCase().includes('sec-010') || String(sector.id).toLowerCase().includes('hidro') ? 'hidroponik' 
                    : String(sector.id).toLowerCase().includes('sec-011') || String(sector.id).toLowerCase().includes('kandang') ? 'kandang'
                    : String(sector.id).toLowerCase().includes('kolam') ? 'kolam'
                    : String(sector.id).split('_')[0];
  const cfg = configs[effectiveId as SectorId] || configs['irigasi']

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-sheet" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid #e4e7ec', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #e4e7ec', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            <IcArrowLeft /> Kembali
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: sector.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{sector.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{sector.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Detail Monitoring</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(85vh - 70px)', overflowY: 'auto' }}>
          {(sector.id === 'kolam' || sector.id === 'irigasi') ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', background: 'var(--bg-base)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Dalam Pengembangan</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, maxWidth: 300 }}>Sistem monitoring untuk {sector.name} sedang dikembangkan dan akan segera hadir.</p>
            </div>
          ) : (
            <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {cfg.metrics.map(m => (
              <div key={m.label} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontWeight: 700, fontSize: 24, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Panel Kontrol</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(cfg.ctrl1 || cfg.ctrl2) ? (
                <>
                  {cfg.ctrl1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{cfg.ctrl1}</div>
                        <div style={{ fontSize: 12, color: pump ? '#2E7D32' : '#9CA3AF', marginTop: 1 }}>{pump ? 'Aktif' : 'Nonaktif'}</div>
                      </div>
                      <Toggle isOn={pump} onChange={handlePumpChange} />
                    </div>
                  )}
                  {cfg.ctrl2 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{cfg.ctrl2}</div>
                        <div style={{ fontSize: 12, color: auto ? '#2E7D32' : '#9CA3AF', marginTop: 1 }}>{auto ? 'Aktif' : 'Nonaktif'}</div>
                      </div>
                      <Toggle isOn={auto} onChange={setAuto} />
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
