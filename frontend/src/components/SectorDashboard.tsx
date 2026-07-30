import { API_URL } from '../constants'
import { useState } from 'react'
import { Sector, SectorId } from '../types'
import { generateTempData } from '../constants'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Toggle, ProgressBar, TempGauge, ChartTooltip } from './UIComponents'
import { IcCheck, IcActivity, IcRefresh, IcX } from './Icons'

interface SectorDashboardProps {
  sector: Sector
  loggedInUser?: any
}

const SECTOR_DATA: Record<SectorId, {
  metrics: { label: string; value: string; color: string; icon: string }[]
  controls: { label: string; desc: string; icon: string; hasTimeSetting?: boolean }[]
}> = {
  kandang: {
    metrics: [
      { label: 'Suhu', value: '28.4Â°C', color: '#E65100', icon: 'ðŸŒ¡ï¸' },
      { label: 'Kelembapan', value: '65%', color: '#1565C0', icon: 'ðŸ’§' },
      { label: 'Populasi Aktif', value: '1.240', color: '#E65100', icon: 'ðŸ“' },
      { label: 'Level Pakan', value: '58%', color: '#795548', icon: 'ðŸŒ¾' },
      { label: 'Air Minum', value: '72%', color: '#1565C0', icon: 'ðŸ’§' },
    ],
    controls: [
      { label: 'Pemberian Pakan Otomatis', desc: 'Jadwal waktu pakan', icon: 'ðŸŒ¾', hasTimeSetting: true },
      { label: 'Pompa Air Minum', desc: 'Pengisian otomatis', icon: 'ðŸ’§', hasTimeSetting: false },
      { label: 'Lampu Kandang', desc: 'Pencahayaan kandang', icon: 'ðŸ’¡', hasTimeSetting: false },
    ],
  },
  kolam: {
    metrics: [
      { label: 'pH Air', value: '7.2', color: '#1565C0', icon: 'ðŸ§ª' },
      { label: 'Suhu Air', value: '26Â°C', color: '#E65100', icon: 'ðŸŒ¡ï¸' },
      { label: 'Kekeruhan', value: 'Normal', color: '#059669', icon: 'ðŸ’§' },
      { label: 'Oksigen Terlarut', value: '7.8 mg/L', color: '#059669', icon: 'ðŸ«§' },
      { label: 'Populasi Ikan', value: '850', color: '#1565C0', icon: 'ðŸŸ' },
      { label: 'Volume Air', value: '92%', color: '#1565C0', icon: 'ðŸŒŠ' },
    ],
    controls: [
      { label: 'Aerator Kolam', desc: 'Sirkulasi oksigen', icon: 'ðŸ«§' },
      { label: 'Pompa Sirkulasi', desc: 'Filter air otomatis', icon: 'ðŸ”„' },
      { label: 'Pemberian Pakan', desc: 'Jadwal 07:00 & 16:00', icon: 'ðŸŸ' },
    ],
  },
  hidroponik: {
    metrics: [
      { label: 'Level Air', value: '85%', color: '#1565C0', icon: 'ðŸŒŠ' },
      { label: 'Suhu Lingkungan', value: '27Â°C', color: '#E65100', icon: 'ðŸŒ¡ï¸' },
    ],
    controls: [
      { label: 'Pompa Air', desc: 'Aliran sirkulasi', icon: 'ðŸ”„', hasTimeSetting: false },
    ],
  },
  irigasi: {
    metrics: [
      { label: 'Kelembapan Tanah', value: '45%', color: '#E65100', icon: 'ðŸŒ±' },
      { label: 'Status', value: 'Kering', color: '#C62828', icon: 'âš ï¸' },
      { label: 'Lahan Total', value: '2.5 Ha', color: 'var(--text-primary)', icon: 'ðŸžï¸' },
      { label: 'Terakhir Irigasi', value: '8 jam lalu', color: '#6B7280', icon: 'ðŸ•' },
      { label: 'Volume Air', value: '68%', color: '#1565C0', icon: 'ðŸ’§' },
      { label: 'Suhu Tanah', value: '29Â°C', color: '#795548', icon: 'ðŸŒ¡ï¸' },
    ],
    controls: [
      { label: 'Sprinkler Otomatis', desc: 'Irigasi area utama', icon: 'ðŸŒ§ï¸' },
      { label: 'Irigasi Tetes', desc: 'Area tanaman sensitif', icon: 'ðŸ’§' },
      { label: 'Sensor Kelembapan', desc: 'Monitoring tanah', icon: 'ðŸ“¡' },
    ],
  },
}

export function SectorDashboard({ sector, loggedInUser }: SectorDashboardProps) {
  const sectorKey = (sector.id.split('_')[0] as SectorId) || sector.id
  const isDevelopment = sectorKey === 'kolam' || sectorKey === 'irigasi'
  const data = SECTOR_DATA[sectorKey] || SECTOR_DATA.kandang
  const [controls, setControls] = useState(data.controls.map((_, i) => i < 2))
  const [tempData] = useState(generateTempData)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const [showAiModal, setShowAiModal] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)

  const handleAiEvaluate = async () => {
    setShowAiModal(true)
    setAiLoading(true)
    try {
      const res = await fetch(`/api/sectors/${sector.id}/evaluate`)
      const evalData = await res.json()
      setAiResult(evalData)
    } catch (e) {
      console.error(e)
      setAiResult({ status: 'Error', kesimpulan: 'Gagal terhubung ke server.', rekomendasi: 'Periksa koneksi Anda.' })
    } finally {
      setAiLoading(false)
    }
  }

  const toggleControl = (idx: number) => {
    const newState = !controls[idx];
    setControls(prev => prev.map((v, i) => i === idx ? newState : v));
    
    // Log activity
    if (loggedInUser) {
      const actionStr = newState ? 'mengaktifkan' : 'mematikan';
      const targetStr = `${data.controls[idx].label} (${sector.name})`;
      fetch(`${API_URL}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: loggedInUser.name,
          action: actionStr,
          target: targetStr
        })
      }).catch(err => console.error(err));
    }
  }

  if (isDevelopment) {
    return (
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>ðŸš§</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Dalam Pengembangan Saja Dulu</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>Saat ini kami terfokus ke sistem Hidroponik dan Kandang Ayam. Fitur untuk {sector.name} akan hadir di pembaruan selanjutnya.</p>
      </div>
    )
  }

  return (
    <div className="sector-dash fade-up">
      <div className="sector-dash-header">
        <div className="sector-dash-icon" style={{ background: sector.colorLight }}>
          {sector.icon}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{sector.name}</h2>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>{sector.unit} â€” Monitoring Real-time</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn" onClick={handleAiEvaluate} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
            âœ¨ Analisis AI
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setLastRefresh(new Date())}>
            <IcRefresh size={13} /> Perbarui
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="sector-dash-grid">
        {data.metrics.map(m => (
          <div key={m.label} className="sector-dash-metric">
            <div className="metric-label">{m.icon} {m.label}</div>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Chart + Controls Row */}
      <div className="sector-dash-main-grid">
        {/* Chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Grafik Suhu Harian</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>Data hari ini â€” diperbarui setiap menit</div>
            </div>
            <div className="badge badge-amber"><IcActivity size={11} /> Batas: 35Â°C</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={tempData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${sector.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sector.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={sector.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} domain={[24, 36]} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="suhu" stroke={sector.color} strokeWidth={2} fill={`url(#grad-${sector.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Control Panel */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Panel Kontrol</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.controls.map((ctrl, idx) => (
              <div key={ctrl.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 12, gap: 12, border: '1px solid var(--border-color, transparent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{ctrl.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{ctrl.label}</div>
                    <div style={{ fontSize: 12, color: controls[idx] ? '#10b981' : 'var(--text-secondary)', marginTop: 1 }}>
                      {controls[idx] ? `Aktif â€” ${ctrl.desc}` : 'Nonaktif'}
                    </div>
                    {ctrl.hasTimeSetting && controls[idx] && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Jadwal:</span>
                        <input type="time" defaultValue="06:00" style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>&amp;</span>
                        <input type="time" defaultValue="17:00" style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
                      </div>
                    )}
                  </div>
                </div>
                <Toggle isOn={controls[idx]} onChange={() => toggleControl(idx)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Level Sumber Daya</div>
        <div className="sector-dash-progress-grid">
          {data.metrics.filter(m => m.value.includes('%')).slice(0, 3).map(m => (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{m.icon} {m.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</span>
              </div>
              <ProgressBar value={parseInt(m.value)} color={m.color} />
            </div>
          ))}
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 500, padding: 24, margin: 20, position: 'relative' }}>
            <button onClick={() => setShowAiModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <IcX size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20 }}>âœ¨</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Agen Analisis Pintar</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mengevaluasi {sector.name}</div>
              </div>
            </div>
            
            {aiLoading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: 30, height: 30, border: '3px solid var(--border-color)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Sedang mengumpulkan & menganalisis data...</p>
              </div>
            ) : aiResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 16, background: aiResult.status === 'Normal' ? '#dcfce7' : aiResult.status === 'Peringatan' ? '#fee2e2' : '#fef3c7', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: aiResult.status === 'Normal' ? '#059669' : aiResult.status === 'Peringatan' ? '#dc2626' : '#d97706', marginBottom: 4, textTransform: 'uppercase' }}>Status Sektor</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{aiResult.status}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>Kesimpulan</div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{aiResult.kesimpulan}</p>
                </div>
                <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-base)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>Rekomendasi Tindakan</div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{aiResult.rekomendasi}</p>
                </div>
                {aiResult.data_points !== undefined && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8 }}>
                    Dianalisis berdasarkan {aiResult.data_points} titik data dalam 24 jam terakhir.
                  </div>
                )}
              </div>
            ) : null}
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}
    </div>
  )
}


