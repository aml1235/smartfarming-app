import { API_URL } from '../constants'
import { useState, useEffect } from 'react'
import { Sector } from '../types'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Toggle, ProgressBar, ChartTooltip } from './UIComponents'
import { IcActivity, IcRefresh, IcX } from './Icons'

interface SectorDashboardProps {
  sector: Sector
  loggedInUser?: any
}

// Helper untuk UI mapping berdasarkan nama key dari DB (Bukan hardcode data, hanya icon/warna)
const getMetricUI = (key: string) => {
  const k = key.toLowerCase()
  if (k.includes('suhu') || k.includes('temp')) return { label: 'Suhu', icon: '🌡️', color: '#E65100', isProgress: false }
  if (k.includes('kelembapan') || k.includes('humid')) return { label: 'Kelembapan', icon: '💧', color: '#1565C0', isProgress: true }
  if (k.includes('cahaya') || k.includes('light')) return { label: 'Intensitas Cahaya', icon: '☀️', color: '#F59E0B', isProgress: false }
  if (k.includes('air') || k.includes('water')) return { label: 'Level Air', icon: '🌊', color: '#1565C0', isProgress: true }
  if (k.includes('ph')) return { label: 'pH', icon: '🧪', color: '#059669', isProgress: false }
  if (k.includes('populasi')) return { label: 'Populasi', icon: '🐓', color: '#795548', isProgress: false }
  return { label: key, icon: '📊', color: '#6B7280', isProgress: false }
}

export function SectorDashboard({ sector, loggedInUser }: SectorDashboardProps) {
  const [metricsData, setMetricsData] = useState<any[]>([])
  const [controls, setControls] = useState<{key: string, label: string, isOn: boolean}[]>([
    { key: 'pump_status', label: 'Pompa Air', isOn: true }
  ])
  const [userOverrides, setUserOverrides] = useState<Record<string, {isOn: boolean, time: number}>>({})
  const [tempData, setTempData] = useState<any[]>([])
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const [showAiModal, setShowAiModal] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  
  // States khusus Kandang Ayam
  const isKandang = sector.id.toString().toLowerCase().includes('kandang') || sector.id === 'SEC-011' || sector.name.toLowerCase().includes('kandang')
  const [kandangLightOn, setKandangLightOn] = useState(() => localStorage.getItem('kandang_light_on') === 'true')
  const [kandangLightSchedule, setKandangLightSchedule] = useState(() => JSON.parse(localStorage.getItem('kandang_light_sch') || '{"on": "18:00", "off": "06:00"}'))
  const [kandangConveyorOn, setKandangConveyorOn] = useState(() => localStorage.getItem('kandang_conveyor_on') === 'true')
  const [kandangConveyorSchedule, setKandangConveyorSchedule] = useState(() => JSON.parse(localStorage.getItem('kandang_conveyor_sch') || '{"on": "07:00", "off": "07:15"}'))

  useEffect(() => {
    if (isKandang) {
      localStorage.setItem('kandang_light_on', kandangLightOn.toString())
      localStorage.setItem('kandang_light_sch', JSON.stringify(kandangLightSchedule))
      localStorage.setItem('kandang_conveyor_on', kandangConveyorOn.toString())
      localStorage.setItem('kandang_conveyor_sch', JSON.stringify(kandangConveyorSchedule))
    }
  }, [kandangLightOn, kandangLightSchedule, kandangConveyorOn, kandangConveyorSchedule, isKandang])

  // Real-time data from local API fallback
  useEffect(() => {
    // Supabase has been removed based on request.
  }, [sector, lastRefresh])
  // 2. Ambil data chart (logs) dari DB lokal
  useEffect(() => {
    const fetchLogs = async () => {
       try {
          const sectorId = sector.sector_id || sector.id
          const res = await fetch(`${API_URL}/api/sectors/${sectorId}/logs`)
          if (res.ok) {
             const data = await res.json()
             setTempData(data)
             
             if (data && data.length > 0) {
               const latest = data[data.length - 1]
               const newMetrics = []
               const newControls = []
               const ignoreKeys = ['time', 'mq135volt', 'wateradc', 'watervoltage', 'water_level', 'lampstatus', 'conveyorstatus', 'lampautomode', 'lastsync', 'systemstatus', 'id', 'created_at', 'updated_at', 'sector_id'];
               for (const key in latest) {
                 if (ignoreKeys.includes(key.toLowerCase())) continue;
                  if (key.toLowerCase().includes('pump') || key.toLowerCase().includes('relay')) {
                    const isPumpOn = String(latest[key]).toUpperCase() === 'ON' || String(latest[key]) === '1'
                    newControls.push({
                       key: key,
                       label: key.includes('pump') ? 'Pompa Air' : 'Relay Control',
                       isOn: isPumpOn
                    })
                  } else {
                    const ui = getMetricUI(key)
                    newMetrics.push({
                      key,
                      label: ui.label,
                      value: latest[key],
                      color: ui.color,
                      icon: ui.icon,
                      isProgress: ui.isProgress
                    })
                  }
               }
               if (newControls.length === 0) {
                 newControls.push({ key: 'pump_status', label: 'Pompa Air', isOn: true });
               }

               // Apply user overrides if they happened within the last 60 seconds
               const finalControls = newControls.map(c => {
                 if (userOverrides[c.key] && (Date.now() - userOverrides[c.key].time < 60000)) {
                   return { ...c, isOn: userOverrides[c.key].isOn };
                 }
                 return c;
               });

               setMetricsData(newMetrics)
               setControls(finalControls)
             } else {
               let fallbackMetrics: any[] = [];
               if (sector.id.toString().toLowerCase().includes('kandang') || sector.id === 'SEC-011') {
                 fallbackMetrics = [
                   { key: 'temperature', label: 'Suhu', value: 0, color: '#E65100', icon: '🌡️', isProgress: false },
                   { key: 'humidity', label: 'Kelembapan', value: 0, color: '#1565C0', icon: '💧', isProgress: true },
                   { key: 'waterLevel', label: 'Level Air', value: 0, color: '#1565C0', icon: '🌊', isProgress: true }
                 ];
               }
               setMetricsData(fallbackMetrics)
               const defaultControls = [{ key: 'pump_status', label: 'Pompa Air', isOn: true }];
               const finalControls = defaultControls.map(c => {
                 if (userOverrides[c.key] && (Date.now() - userOverrides[c.key].time < 60000)) {
                   return { ...c, isOn: userOverrides[c.key].isOn };
                 }
                 return c;
               });
               setControls(finalControls)
             }
          }
       } catch (e) {
          console.error('Failed to fetch chart data', e)
       }
    }
    fetchLogs()
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [sector, lastRefresh])

  const handleAiEvaluate = async () => {
    setShowAiModal(true)
    setAiLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/sectors/${sector.sector_id || sector.id}/evaluate`)
      const evalData = await res.json()
      setAiResult(evalData)
    } catch (e) {
      console.error(e)
      setAiResult({ status: 'Error', kesimpulan: 'Gagal terhubung ke server.', rekomendasi: 'Periksa koneksi Anda.' })
    } finally {
      setAiLoading(false)
    }
  }

  const toggleControl = async (ctrlKey: string, currentState: boolean) => {
    const newState = !currentState;
    const commandStr = newState ? 'ON' : 'OFF';
    
    // Update local state instantly and record the override time
    setUserOverrides(prev => ({ ...prev, [ctrlKey]: { isOn: newState, time: Date.now() } }));
    setControls(prev => prev.map(c => c.key === ctrlKey ? { ...c, isOn: newState } : c));
    
    // Log activity
    if (loggedInUser) {
      const actionStr = newState ? 'mengaktifkan' : 'mematikan';
      fetch(`${API_URL}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: loggedInUser.name,
          action: actionStr,
          target: `${ctrlKey} (${sector.name})`
        })
      }).catch(err => console.error(err));
    }

    try {
        const sectorId = sector.sector_id || sector.id
        await fetch(`${API_URL}/api/sector/${sectorId}/control`, {
           method: 'POST',
           headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
           },
           body: JSON.stringify({ command: commandStr, target: ctrlKey })
        });
    } catch (e) {
        console.error('Control failed', e);
        // Revert UI if failed
        setControls(prev => prev.map(c => c.key === ctrlKey ? { ...c, isOn: currentState } : c));
    }
  }

  const toggleKandangControl = async (target: string, currentState: boolean, setLocalState: any) => {
    const newState = !currentState;
    setLocalState(newState); // Optimistic UI update

    try {
        const sectorId = sector.sector_id || sector.id;
        await fetch(`${API_URL}/api/sector/${sectorId}/control`, {
           method: 'POST',
           headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
           },
           body: JSON.stringify({ command: newState ? 'ON' : 'OFF', target })
        });
    } catch (e) {
        console.error('Kandang control failed', e);
        setLocalState(currentState); // Revert on fail
    }
  }

  return (
    <div className="sector-dash fade-up">
      <div className="sector-dash-header">
        <div className="sector-dash-icon" style={{ background: sector.colorLight || '#f0f0f0' }}>
          {sector.icon || '🌱'}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{sector.name}</h2>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>{sector.unit} — Monitoring Real-time</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn" onClick={handleAiEvaluate} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
            ✨ Analisis AI
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
        {metricsData.length > 0 ? metricsData.map(m => (
          <div key={m.key} className="sector-dash-metric">
            <div className="metric-label">{m.icon} {m.label}</div>
            <div className="metric-value" style={{ color: m.color }}>
              {m.value} {m.isProgress ? '%' : (m.key.toLowerCase().includes('temp') ? '°C' : '')}
            </div>
          </div>
        )) : (
          <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Menunggu data sensor masuk...</div>
        )}
      </div>

      {/* Chart + Controls Row */}
      <div className="sector-dash-main-grid">
        {/* Chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Grafik Riwayat</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>24 Jam Terakhir</div>
            </div>
            <div className="badge badge-amber"><IcActivity size={11} /> Data Historis</div>
          </div>
          {tempData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={tempData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-chart`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                {/* Dynamically render lines for available keys in chart */}
                <Area type="monotone" dataKey="temperature" stroke="#E65100" strokeWidth={2} fill="transparent" dot={false} />
                <Area type="monotone" dataKey="humidity" stroke="#1565C0" strokeWidth={2} fill={`url(#grad-chart)`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Belum ada riwayat data di database lokal
             </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Panel Kontrol & Otomatisasi</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isKandang ? (
              [
                  { 
                    label: 'Lampu Penerangan', 
                    icon: '💡', 
                    val: kandangLightOn, 
                    set: () => toggleKandangControl('lamp', kandangLightOn, setKandangLightOn), 
                    sch: kandangLightSchedule, 
                    setSch: setKandangLightSchedule 
                  },
                  { 
                    label: 'Conveyor Kotoran', 
                    icon: '⚙️', 
                    val: kandangConveyorOn, 
                    set: () => toggleKandangControl('conveyor', kandangConveyorOn, setKandangConveyorOn), 
                    sch: kandangConveyorSchedule, 
                    setSch: setKandangConveyorSchedule 
                  },
                ].map(ctrl => (
                  <div key={ctrl.label} style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: 'var(--bg-base)', borderRadius: 8, gap: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{ctrl.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ctrl.label}</div>
                          <div style={{ fontSize: 11, color: ctrl.val ? '#2E7D32' : '#9CA3AF' }}>{ctrl.val ? 'Status: Menyala' : 'Status: Mati'}</div>
                        </div>
                      </div>
                      <Toggle isOn={ctrl.val} onChange={ctrl.set as any} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, flex: 1 }}>Jadwal Timer:</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#6B7280' }}>Nyala</span>
                        <input 
                          type="time" 
                          value={ctrl.sch.on} 
                          onChange={e => ctrl.setSch({ ...ctrl.sch, on: e.target.value })}
                          style={{ padding: '4px 6px', border: '1px solid #e4e7ec', borderRadius: 4, fontSize: 11, outline: 'none', background: 'transparent' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#6B7280' }}>Mati</span>
                        <input 
                          type="time" 
                          value={ctrl.sch.off} 
                          onChange={e => ctrl.setSch({ ...ctrl.sch, off: e.target.value })}
                          style={{ padding: '4px 6px', border: '1px solid #e4e7ec', borderRadius: 4, fontSize: 11, outline: 'none', background: 'transparent' }}
                        />
                      </div>
                    </div>
                  </div>
                ))
            ) : controls.length > 0 ? controls.map((ctrl) => (
              <div key={ctrl.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🔄</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{ctrl.label}</div>
                    <div style={{ fontSize: 12, color: ctrl.isOn ? '#10b981' : 'var(--text-secondary)', marginTop: 1 }}>
                      {ctrl.isOn ? `ON` : 'OFF'}
                    </div>
                  </div>
                </div>
                <Toggle isOn={ctrl.isOn} onChange={() => toggleControl(ctrl.key, ctrl.isOn)} />
              </div>
            )) : (
              <div style={{ padding: 20, color: 'var(--text-secondary)', textAlign: 'center' }}>Tidak ada status kontrol dari sensor di database.</div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Level Indikator (Persentase)</div>
        <div className="sector-dash-progress-grid">
          {metricsData.filter(m => m.isProgress).length > 0 ? metricsData.filter(m => m.isProgress).map(m => (
            <div key={m.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{m.icon} {m.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}%</span>
              </div>
              <ProgressBar value={parseInt(m.value) || 0} color={m.color} />
            </div>
          )) : (
             <div style={{ color: 'var(--text-secondary)' }}>Tidak ada data metrik persentase.</div>
          )}
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
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20 }}>✨</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Agen Analisis Pintar</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mengevaluasi {sector.name}</div>
              </div>
            </div>
            
            {aiLoading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: 30, height: 30, border: '3px solid var(--border-color)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Sedang mengumpulkan & menganalisis data riwayat database...</p>
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
                    Dianalisis berdasarkan {aiResult.data_points} titik data dalam 24 jam terakhir di database lokal.
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
