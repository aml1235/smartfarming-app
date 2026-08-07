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

const getMetricUI = (key: string) => {
  const k = key.toLowerCase()
  if (k.includes('suhu') || k.includes('temp')) return { label: 'Suhu', icon: '\u{1F321}\uFE0F', color: '#E65100', isProgress: false }
  if (k.includes('kelembapan') || k.includes('humid')) return { label: 'Kelembapan', icon: '\u{1F4A7}', color: '#1565C0', isProgress: true }
  if (k.includes('cahaya') || k.includes('light')) return { label: 'Intensitas Cahaya', icon: '\u2600\uFE0F', color: '#F59E0B', isProgress: false }
  if (k.includes('air') || k.includes('water')) return { label: 'Level Air', icon: '\u{1F30A}', color: '#1565C0', isProgress: true }
  if (k.includes('pakan') || k.includes('feedlevel')) return { label: 'Sisa Pakan', icon: '\u{1F33E}', color: '#F59E0B', isProgress: true }
  if (k.includes('jarak') || k.includes('feeddist')) return { label: 'Jarak Pakan', icon: '\u{1F4CF}', color: '#6B7280', isProgress: false }
  return { label: key, icon: '\u{1F4CA}', color: '#6B7280', isProgress: false }
}

// ─── ROOT EXPORT ──────────────────────────────────────────────────────────────
export function SectorDashboard({ sector, loggedInUser }: SectorDashboardProps) {
  const isKandang = sector.id.toString().toLowerCase().includes('kandang') || sector.id === 'SEC-011' || sector.name.toLowerCase().includes('kandang')
  const [tempData, setTempData] = useState<any[]>([])
  const [lastRefresh, setLastRefresh] = useState(new Date())
  if (isKandang) return <KandangDashboard sector={sector} loggedInUser={loggedInUser} tempData={tempData} setTempData={setTempData} lastRefresh={lastRefresh} setLastRefresh={setLastRefresh} />
  return <GenericDashboard sector={sector} loggedInUser={loggedInUser} tempData={tempData} setTempData={setTempData} lastRefresh={lastRefresh} setLastRefresh={setLastRefresh} />
}

// ─── KANDANG DASHBOARD ────────────────────────────────────────────────────────
function KandangDashboard({ sector, loggedInUser, tempData, setTempData, lastRefresh, setLastRefresh }: any) {
  const [suhu, setSuhu]         = useState('--')
  const [lembap, setLembap]     = useState('--')
  const [amonia, setAmonia]     = useState('--')
  const [levelAir, setLevelAir] = useState(0)
  const [sisPakan, setSisPakan] = useState(0)
  const [jrkPakan, setJrkPakan] = useState('--')
  const [lampOn, setLampOn]     = useState(false)
  const [pompaOn, setPompaOn]   = useState(false)
  const [convOn, setConvOn]     = useState(false)
  const [convPhase, setConvPhase] = useState('Diam')
  const [feederOn, setFeederOn] = useState(false)
  const [lampAuto, setLampAuto]   = useState(true)
  const [pompaAuto, setPompaAuto] = useState(true)
  const [lampJadwalOn, setLampJadwalOn]   = useState('18:00')
  const [lampJadwalOff, setLampJadwalOff] = useState('06:00')
  const [cv1On, setCv1On]     = useState('06:00')
  const [cv2On, setCv2On]     = useState('18:00')
  const [cv2En, setCv2En]     = useState(true)
  const [cvRun, setCvRun]     = useState('10')
  const [cvPause, setCvPause] = useState('3')
  const [cvSpeed, setCvSpeed] = useState('100')
  const [feedTime1, setFeedTime1]     = useState('07:00')
  const [feedDur, setFeedDur]         = useState('15')
  const [feedTime2, setFeedTime2]     = useState('17:00')
  const [feedTime2En, setFeedTime2En] = useState(true)
  const [jogSending, setJogSending] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiResult, setAiResult]     = useState<any>(null)
  const [activeTab, setActiveTab]   = useState<'manual' | 'auto'>('manual')
  const sectorId = sector.sector_id || sector.id

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sectors/${sectorId}/logs`)
        if (!res.ok) return
        const data = await res.json()
        setTempData(data.map((d: any) => ({ ...d, temperature: (d.temperature != null && Number(d.temperature) > 0) ? d.temperature : null, humidity: (d.humidity != null && Number(d.humidity) > 0) ? d.humidity : null })))
        let latest: any = {}
        if (typeof sector.metrics === 'string') { try { latest = JSON.parse(sector.metrics) } catch (_) {} }
        else if (sector.metrics) { latest = { ...sector.metrics } }
        if (data && data.length > 0) {
          const rev = [...data].reverse()
          latest = { ...latest, ...data[data.length - 1] }
          const pick = (keys: string[]) => rev.find((d: any) => keys.some(k => d[k] && Number(d[k]) > 0))
          if (!latest.temperature || Number(latest.temperature) === 0) { const v = pick(['temperature']); if (v) latest.temperature = v.temperature }
          if (!latest.humidity || Number(latest.humidity) === 0) { const v = pick(['humidity']); if (v) latest.humidity = v.humidity }
          if (!latest.ammonia || Number(latest.ammonia) === 0) { const v = pick(['ammonia', 'mq135']); if (v) latest.ammonia = v.ammonia || v.mq135 }
          if (!latest.waterLevel || Number(latest.waterLevel) === 0) { const v = pick(['waterLevel', 'water_level']); if (v) latest.waterLevel = v.waterLevel || v.water_level }
          if (!latest.feedLevel || Number(latest.feedLevel) === 0) { const v = pick(['feedLevel']); if (v) latest.feedLevel = v.feedLevel }
        }
        if (latest.temperature !== undefined) setSuhu(Number(latest.temperature).toFixed(1))
        if (latest.humidity !== undefined) setLembap(Number(latest.humidity).toFixed(0))
        if (latest.ammonia !== undefined) setAmonia(Number(latest.ammonia).toFixed(0))
        if (latest.waterLevel !== undefined) setLevelAir(Math.min(100, Math.max(0, Number(latest.waterLevel))))
        if (latest.feedLevel !== undefined) setSisPakan(Math.min(100, Math.max(0, Number(latest.feedLevel))))
        if (latest.feedDistance !== undefined) setJrkPakan(String(latest.feedDistance))
        if (latest.lampStatus !== undefined) setLampOn(String(latest.lampStatus) === '1')
        if (latest.conveyorStatus !== undefined) setConvOn(String(latest.conveyorStatus) === '1')
        if (latest.conveyorPhase !== undefined) setConvPhase(latest.conveyorPhase)
        if (latest.pumpStatus !== undefined) setPompaOn(String(latest.pumpStatus) === '1')
        if (latest.feederStatus !== undefined) setFeederOn(String(latest.feederStatus) === '1')
        if (latest.lampAutoMode !== undefined) setLampAuto(String(latest.lampAutoMode) === '1')
        if (latest.pompaAutoMode !== undefined) setPompaAuto(String(latest.pompaAutoMode) === '1')
        if (latest.lampOn) setLampJadwalOn(latest.lampOn)
        if (latest.lampOff) setLampJadwalOff(latest.lampOff)
        if (latest.cv1On) setCv1On(latest.cv1On)
        if (latest.cv2On) setCv2On(latest.cv2On)
        if (latest.cv2En !== undefined) setCv2En(String(latest.cv2En) === '1')
        if (latest.convRun) setCvRun(String(latest.convRun))
        if (latest.convPause) setCvPause(String(latest.convPause))
        if (latest.convSpeed) setCvSpeed(String(latest.convSpeed))
        if (latest.feedTime1) setFeedTime1(latest.feedTime1)
        if (latest.feedTime2) setFeedTime2(latest.feedTime2)
        if (latest.feedTime2En !== undefined) setFeedTime2En(String(latest.feedTime2En) === '1')
        if (latest.feedDuration) setFeedDur(String(latest.feedDuration))
      } catch (e) { console.error(e) }
    }
    load(); const iv = setInterval(load, 10000); return () => clearInterval(iv)
  }, [sector, lastRefresh])

  const ctrl = async (target: string, command: string) => { try { await fetch(`${API_URL}/api/sector/${sectorId}/control`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ command, target }) }) } catch (e) { console.error(e) } }
  const cfg  = async (target: string, value: string)   => { try { await fetch(`${API_URL}/api/sector/${sectorId}/config`,  { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ target, value })   }) } catch (e) { console.error(e) } }
  const logA = (action: string) => { if (!loggedInUser) return; fetch(`${API_URL}/api/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_name: loggedInUser.name, action, target: sector.name }) }).catch(() => {}) }

  const toggleLamp   = () => { const n = !lampOn;   setLampOn(n);   ctrl('lamp',  n ? 'ON' : 'OFF'); logA(n ? 'Menyalakan Lampu'  : 'Mematikan Lampu')  }
  const togglePompa  = () => { if (pompaAuto) return; const n = !pompaOn;  setPompaOn(n);  ctrl('pompa', n ? 'ON' : 'OFF'); logA(n ? 'Menyalakan Pompa'  : 'Mematikan Pompa')  }
  const toggleFeeder = () => { const n = !feederOn; setFeederOn(n); ctrl('feeder',n ? 'ON' : 'OFF'); logA(n ? 'Buka Pakan' : 'Tutup Pakan') }
  const startConv = () => { setConvOn(true);  setConvPhase('Maju'); ctrl('conveyor', 'ON');  logA('Menjalankan Conveyor') }
  const stopConv  = () => { setConvOn(false); setConvPhase('Diam'); ctrl('conveyor', 'OFF'); logA('Stop Conveyor') }
  const jogConv   = async (dir: 'fwd' | 'rev' | 'stop') => { setJogSending(true); setConvPhase(dir === 'fwd' ? 'Maju' : dir === 'rev' ? 'Mundur' : 'Diam'); await ctrl('convjog', dir); setJogSending(false) }
  const toggleLampAuto  = () => { const n = !lampAuto;  setLampAuto(n);  ctrl('lampauto',  n ? 'ON' : 'OFF') }
  const togglePompaAuto = () => { const n = !pompaAuto; setPompaAuto(n); ctrl('pompaauto', n ? 'ON' : 'OFF') }
  const handleAiEvaluate = async () => { setShowAiModal(true); setAiLoading(true); try { const r = await fetch(`${API_URL}/api/sectors/${sectorId}/evaluate`); setAiResult(await r.json()) } catch { setAiResult({ status: 'Error', kesimpulan: 'Gagal.', rekomendasi: 'Periksa koneksi.' }) } finally { setAiLoading(false) } }

  const ac  = Number(amonia); const sc = Number(suhu)
  const amoniaColor = ac > 25 ? '#dc2626' : ac > 15 ? '#d97706' : '#059669'
  const suhuColor   = sc > 32 ? '#dc2626' : sc > 28 ? '#d97706' : '#059669'
  const card: any = { background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-color)', padding: '16px 18px' }
  const inp:  any = { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13 }
  const btn4: any = { flex: 1, padding: '8px 2px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 11, border: '1px solid', transition: 'opacity 0.15s' }

  return (
    <div className="sector-dash fade-up">
      <div className="sector-dash-header">
        <div className="sector-dash-icon" style={{ background: sector.colorLight || '#fff3e0' }}>{sector.icon || '\u{1F414}'}</div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{sector.name}</h2>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>{sector.unit} \u2014 Monitoring Real-time</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn" onClick={handleAiEvaluate} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>\u2728 Analisis AI</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setLastRefresh(new Date())}><IcRefresh size={13} /> Perbarui</button>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>\u{1F321}\uFE0F</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Suhu</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: suhuColor }}>{suhu}<span style={{ fontSize: 13 }}>\u00B0C</span></div>
        </div>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>\u{1F4A7}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Kelembapan</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1565C0' }}>{lembap}<span style={{ fontSize: 13 }}>%</span></div>
        </div>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>\u{1F32C}\uFE0F</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Amonia</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: amoniaColor }}>{amonia}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ADC raw</div>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>\u{1F30A}</span>
            <div><div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Level Air</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: levelAir < 20 ? '#dc2626' : '#1565C0' }}>{levelAir}<span style={{ fontSize: 12 }}>%</span></div></div>
          </div>
          <ProgressBar value={levelAir} color={levelAir < 20 ? '#dc2626' : '#1565C0'} />
        </div>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>\u{1F33E}</span>
            <div><div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Sisa Pakan</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: sisPakan < 20 ? '#dc2626' : '#F59E0B' }}>{sisPakan}<span style={{ fontSize: 12 }}>%</span></div></div>
          </div>
          <ProgressBar value={sisPakan} color={sisPakan < 20 ? '#dc2626' : '#F59E0B'} />
          {jrkPakan !== '--' && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>\u{1F4CF} Jarak: {jrkPakan} cm</div>}
        </div>
      </div>

      {/* Chart + Control Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Grafik Riwayat</div><div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>24 Jam Terakhir</div></div>
            <div className="badge badge-amber"><IcActivity size={11} /> Data Historis</div>
          </div>
          {tempData.length > 0 ? (
            <ResponsiveContainer width="100%" height={195}>
              <AreaChart data={tempData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-ks" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E65100" stopOpacity={0.18}/><stop offset="95%" stopColor="#E65100" stopOpacity={0}/></linearGradient>
                  <linearGradient id="grad-kh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1565C0" stopOpacity={0.18}/><stop offset="95%" stopColor="#1565C0" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip />}/>
                <Area type="monotone" dataKey="temperature" stroke="#E65100" strokeWidth={2} fill="url(#grad-ks)" dot={false} connectNulls name="Suhu \u00B0C"/>
                <Area type="monotone" dataKey="humidity"    stroke="#1565C0" strokeWidth={2} fill="url(#grad-kh)" dot={false} connectNulls name="Kelembapan %"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 195, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Belum ada data historis</div>}
        </div>

        <div style={card}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['manual', 'auto'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: activeTab === t ? 'var(--color-primary,#3B82F6)' : 'var(--bg-base)', color: activeTab === t ? 'white' : 'var(--text-secondary)' }}>
                {t === 'manual' ? '\u{1F579}\uFE0F Manual' : '\u{1F916} Otomatis'}
              </button>
            ))}
          </div>

          {activeTab === 'manual' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CtrlRow icon="\u{1F4A1}" label="Lampu Kandang" sub={lampAuto ? '(Auto aktif)' : lampOn ? 'Menyala' : 'Mati'} subColor={lampOn ? '#059669' : '#9CA3AF'} right={<Toggle isOn={lampOn} onChange={toggleLamp} disabled={lampAuto} />} />
              <CtrlRow icon="\u{1F4A7}" label="Pompa Air"     sub={pompaAuto ? '(Auto aktif)' : pompaOn ? 'Menyala' : 'Mati'} subColor={pompaOn ? '#059669' : '#9CA3AF'} right={<Toggle isOn={pompaOn} onChange={togglePompa} disabled={pompaAuto} />} />
              <CtrlRow icon="\u{1F33E}" label="Unit Pakan"    sub={feederOn ? 'Membuka...' : 'Tertutup'} subColor={feederOn ? '#059669' : '#9CA3AF'} right={<Toggle isOn={feederOn} onChange={toggleFeeder} />} />
              <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>\u2699\uFE0F</span>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Conveyor Kotoran</div><div style={{ fontSize: 11, color: convOn ? '#059669' : '#9CA3AF' }}>{convOn ? <b style={{ color: '#059669' }}>{convPhase}</b> : 'Diam'}</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                  <button onClick={startConv} style={{ ...btn4, background: '#dcfce7', color: '#059669', borderColor: '#059669' }}>\u25B6 Jalankan</button>
                  <button onClick={stopConv}  style={{ ...btn4, background: '#fee2e2', color: '#dc2626', borderColor: '#dc2626' }}>\u23F9 Stop</button>
                  <button onMouseDown={() => jogConv('fwd')} onMouseUp={() => jogConv('stop')} onTouchStart={() => jogConv('fwd')} onTouchEnd={() => jogConv('stop')} disabled={jogSending} style={{ ...btn4, background: '#dbeafe', color: '#1d4ed8', borderColor: '#1d4ed8' }}>\u2191 Maju</button>
                  <button onMouseDown={() => jogConv('rev')} onMouseUp={() => jogConv('stop')} onTouchStart={() => jogConv('rev')} onTouchEnd={() => jogConv('stop')} disabled={jogSending} style={{ ...btn4, background: '#fef3c7', color: '#d97706', borderColor: '#d97706' }}>\u2193 Mundur</button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 5, textAlign: 'center' }}>Tahan Maju/Mundur untuk jog. Lepas = stop (maks 10 dtk)</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 390, overflowY: 'auto', paddingRight: 2 }}>
              {/* Auto Lampu */}
              <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lampAuto ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>\u{1F4A1}</span><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Otomasi Lampu</div><div style={{ fontSize: 11, color: lampAuto ? '#2E7D32' : '#9CA3AF' }}>{lampAuto ? 'Berdasarkan jadwal' : 'Mode manual'}</div></div></div>
                  <Toggle isOn={lampAuto} onChange={toggleLampAuto} />
                </div>
                {lampAuto && <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>JAM NYALA</div><input type="time" value={lampJadwalOn} style={inp} onChange={e => { setLampJadwalOn(e.target.value); cfg('lampon', e.target.value) }}/></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>JAM MATI</div><input type="time" value={lampJadwalOff} style={inp} onChange={e => { setLampJadwalOff(e.target.value); cfg('lampoff', e.target.value) }}/></div>
                </div>}
              </div>
              {/* Auto Conveyor */}
              <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ fontSize: 18 }}>\u2699\uFE0F</span><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Conveyor \u2014 Jam mulai</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Satu siklus maju\u2013jeda\u2013mundur per jadwal</div></div></div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>JADWAL 1</div><input type="time" value={cv1On} style={inp} onChange={e => { setCv1On(e.target.value); cfg('conveyoron', e.target.value) }}/></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>JADWAL 2</div><input type="time" value={cv2On} style={{ ...inp, opacity: cv2En ? 1 : 0.4 }} disabled={!cv2En} onChange={e => { setCv2On(e.target.value); cfg('conveyor2on', e.target.value) }}/></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Aktifkan jadwal 2</span><Toggle isOn={cv2En} onChange={() => { const n = !cv2En; setCv2En(n); cfg('conveyor2en', n ? '1' : '0') }}/></div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Parameter Siklus</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>DURASI (dtk)</div><input type="number" min="1" max="300" value={cvRun} style={inp} onChange={e => { setCvRun(e.target.value); cfg('convrun', e.target.value) }}/></div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>JEDA (dtk)</div><input type="number" min="1" max="300" value={cvPause} style={inp} onChange={e => { setCvPause(e.target.value); cfg('convpause', e.target.value) }}/></div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>KECEP. %</div><input type="number" min="20" max="100" value={cvSpeed} style={inp} onChange={e => { setCvSpeed(e.target.value); cfg('convspeed', e.target.value) }}/></div>
                  </div>
                </div>
              </div>
              {/* Auto Pompa */}
              <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: 12, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>\u{1F4A7}</span><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Otomasi Pompa Air</div><div style={{ fontSize: 11, color: pompaAuto ? '#2E7D32' : '#9CA3AF' }}>{pompaAuto ? 'Sensor mengatur otomatis' : 'Mode manual'}</div></div></div>
                <Toggle isOn={pompaAuto} onChange={togglePompaAuto}/>
              </div>
              {/* Auto Pakan */}
              <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ fontSize: 18 }}>\u{1F33E}</span><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>\u{1F33E} Pemberian 1</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Penutup membuka lalu menutup sendiri</div></div></div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>JAM</div><input type="time" value={feedTime1} style={inp} onChange={e => { setFeedTime1(e.target.value); cfg('feedtime1', e.target.value) }}/></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>LAMA BUKA (DETIK)</div><input type="number" min="1" max="120" value={feedDur} style={inp} onChange={e => { setFeedDur(e.target.value); cfg('feedduration', e.target.value) }}/></div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: feedTime2En ? 10 : 0 }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>\u{1F33E} Pemberian 2</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Matikan kalau cukup sekali sehari</div></div>
                    <Toggle isOn={feedTime2En} onChange={() => { const n = !feedTime2En; setFeedTime2En(n); cfg('feedtime2en', n ? '1' : '0') }}/>
                  </div>
                  {feedTime2En && <div><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>JAM</div><input type="time" value={feedTime2} style={inp} onChange={e => { setFeedTime2(e.target.value); cfg('feedtime2', e.target.value) }}/></div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAiModal && <AiModal sector={sector} aiLoading={aiLoading} aiResult={aiResult} onClose={() => setShowAiModal(false)} />}
    </div>
  )
}

// Helper row component
function CtrlRow({ icon, label, sub, subColor, right }: { icon: string; label: string; sub: string; subColor: string; right: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div><div style={{ fontSize: 11, color: subColor }}>{sub}</div></div>
      </div>
      {right}
    </div>
  )
}

// AI Modal shared component
function AiModal({ sector, aiLoading, aiResult, onClose }: any) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 500, padding: 24, margin: 20, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><IcX size={20}/></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20 }}>\u2728</div>
          <div><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Agen Analisis Pintar</h3><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mengevaluasi {sector.name}</div></div>
        </div>
        {aiLoading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ margin: '0 auto 16px', width: 30, height: 30, border: '3px solid var(--border-color)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Sedang menganalisis data riwayat...</p>
          </div>
        ) : aiResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 16, background: aiResult.status === 'Normal' ? '#dcfce7' : '#fee2e2', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: aiResult.status === 'Normal' ? '#059669' : '#dc2626', marginBottom: 4, textTransform: 'uppercase' }}>Status Sektor</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{aiResult.status}</div>
            </div>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>Kesimpulan</div><p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{aiResult.kesimpulan}</p></div>
            <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12 }}><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>Rekomendasi</div><p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{aiResult.rekomendasi}</p></div>
          </div>
        ) : null}
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

// ─── GENERIC DASHBOARD ────────────────────────────────────────────────────────
function GenericDashboard({ sector, loggedInUser, tempData, setTempData, lastRefresh, setLastRefresh }: any) {
  const [metricsData, setMetricsData] = useState<any[]>([])
  const [controls, setControls] = useState<any[]>([{ key: 'pump_status', label: 'Pompa Air', isOn: true }])
  const [userOverrides, setUserOverrides] = useState<Record<string, { isOn: boolean; time: number }>>({})
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiResult, setAiResult]     = useState<any>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const sectorId = sector.sector_id || sector.id
        const res = await fetch(`${API_URL}/api/sectors/${sectorId}/logs`)
        if (!res.ok) return
        const data = await res.json()
        setTempData(data.map((d: any) => ({ ...d, temperature: (d.temperature != null && Number(d.temperature) > 0) ? d.temperature : null, humidity: (d.humidity != null && Number(d.humidity) > 0) ? d.humidity : null })))
        let latest: any = {}
        if (typeof sector.metrics === 'string') { try { latest = JSON.parse(sector.metrics) } catch (_) {} } else if (sector.metrics) { latest = { ...sector.metrics } }
        if (data?.length > 0) latest = { ...latest, ...data[data.length - 1] }
        if (Object.keys(latest).length > 0) {
          const nm: any[] = [], nc: any[] = []
          const allow = ['temperature','humidity','ammonia','waterlevel','feedlevel','feeddistance','populasi','suhu','kelembapan','cahaya','light']
          for (const key in latest) {
            const kl = key.toLowerCase()
            if (!allow.some(a => kl.includes(a))) continue
            if (kl.includes('pump') || kl.includes('relay')) { const on = String(latest[key]).toUpperCase() === 'ON' || String(latest[key]) === '1'; const lbl = kl.includes('pump') ? 'Pompa Air' : 'Relay'; const ex = nc.find((c: any) => c.label === lbl); if (ex) { ex.isOn = on } else nc.push({ key, label: lbl, isOn: on }) }
            else { const ui = getMetricUI(key); const ex = nm.find((m: any) => m.label === ui.label); if (ex) { ex.value = latest[key] } else nm.push({ key, label: ui.label, value: latest[key], color: ui.color, icon: ui.icon, isProgress: ui.isProgress }) }
          }
          if (nc.length === 0) nc.push({ key: 'pump_status', label: 'Pompa Air', isOn: true })
          const fc = nc.map((c: any) => (userOverrides[c.key] && Date.now() - userOverrides[c.key].time < 60000) ? { ...c, isOn: userOverrides[c.key].isOn } : c)
          setMetricsData(Array.from(new Map(nm.map((i: any) => [i.label, i])).values()))
          setControls(Array.from(new Map(fc.map((i: any) => [i.label, i])).values()))
        }
      } catch (e) { console.error(e) }
    }
    fetchLogs(); const iv = setInterval(fetchLogs, 10000); return () => clearInterval(iv)
  }, [sector, lastRefresh])

  const handleAiEvaluate = async () => {
    setShowAiModal(true); setAiLoading(true)
    try { const r = await fetch(`${API_URL}/api/sectors/${sector.sector_id || sector.id}/evaluate`); setAiResult(await r.json()) }
    catch { setAiResult({ status: 'Error', kesimpulan: 'Gagal.', rekomendasi: 'Periksa koneksi.' }) }
    finally { setAiLoading(false) }
  }
  const toggleControl = async (ctrlKey: string, cur: boolean) => {
    const n = !cur; setUserOverrides(p => ({ ...p, [ctrlKey]: { isOn: n, time: Date.now() } })); setControls(p => p.map(c => c.key === ctrlKey ? { ...c, isOn: n } : c))
    if (loggedInUser) fetch(`${API_URL}/api/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_name: loggedInUser.name, action: n ? 'mengaktifkan' : 'mematikan', target: `${ctrlKey} (${sector.name})` }) }).catch(() => {})
    try { await fetch(`${API_URL}/api/sector/${sector.sector_id || sector.id}/control`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ command: n ? 'ON' : 'OFF', target: ctrlKey }) }) }
    catch { setControls(p => p.map(c => c.key === ctrlKey ? { ...c, isOn: cur } : c)) }
  }

  return (
    <div className="sector-dash fade-up">
      <div className="sector-dash-header">
        <div className="sector-dash-icon" style={{ background: sector.colorLight || '#f0f0f0' }}>{sector.icon || '\u{1F331}'}</div>
        <div><h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{sector.name}</h2><p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>{sector.unit} \u2014 Monitoring Real-time</p></div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn" onClick={handleAiEvaluate} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>\u2728 Analisis AI</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setLastRefresh(new Date())}><IcRefresh size={13}/> Perbarui</button>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div className="sector-dash-grid">
        {metricsData.length > 0 ? metricsData.map(m => (<div key={m.key} className="sector-dash-metric"><div className="metric-label">{m.icon} {m.label}</div><div className="metric-value" style={{ color: m.color }}>{m.value} {m.isProgress ? '%' : (m.key.toLowerCase().includes('temp') ? '\u00B0C' : '')}</div></div>))
        : <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Menunggu data sensor...</div>}
      </div>
      <div className="sector-dash-main-grid">
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Grafik Riwayat</div><div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>24 Jam Terakhir</div></div>
            <div className="badge badge-amber"><IcActivity size={11}/> Data Historis</div>
          </div>
          {tempData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={tempData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs><linearGradient id="grad-g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false}/><YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Area type="monotone" dataKey="temperature" stroke="#E65100" strokeWidth={2} fill="transparent" dot={false} connectNulls/>
                <Area type="monotone" dataKey="humidity"    stroke="#1565C0" strokeWidth={2} fill="url(#grad-g)"  dot={false} connectNulls/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Belum ada data</div>}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Panel Kontrol</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {controls.length > 0 ? controls.map((c: any) => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 20 }}>\u{1F504}</span><div><div style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</div><div style={{ fontSize: 12, color: c.isOn ? '#10b981' : 'var(--text-secondary)', marginTop: 1 }}>{c.isOn ? 'ON' : 'OFF'}</div></div></div>
                <Toggle isOn={c.isOn} onChange={() => toggleControl(c.key, c.isOn)}/>
              </div>
            )) : <div style={{ padding: 20, color: 'var(--text-secondary)', textAlign: 'center' }}>Tidak ada kontrol.</div>}
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Level Indikator</div>
        <div className="sector-dash-progress-grid">
          {metricsData.filter(m => m.isProgress).length > 0 ? metricsData.filter(m => m.isProgress).map(m => (
            <div key={m.key}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{m.icon} {m.label}</span><span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}%</span></div><ProgressBar value={parseInt(m.value) || 0} color={m.color}/></div>
          )) : <div style={{ color: 'var(--text-secondary)' }}>Tidak ada metrik persentase.</div>}
        </div>
      </div>
      {showAiModal && <AiModal sector={sector} aiLoading={aiLoading} aiResult={aiResult} onClose={() => setShowAiModal(false)} />}
    </div>
  )
}
