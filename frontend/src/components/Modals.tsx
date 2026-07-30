import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Sector, SectorId } from '../types'
import { generateTempData } from '../constants'
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

export function KandangDetail({ sector, onBack }: { sector: Sector; onBack: () => void }) {
  const [feedAuto, setFeedAuto] = useState(true)
  const [drinkAuto, setDrinkAuto] = useState(true)
  const [fanOn, setFanOn] = useState(false)
  const [temp] = useState(28.4)
  const [waterLevel] = useState(72)
  const [feedLevel] = useState(58)
  const [tempData] = useState(generateTempData)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal-sheet" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
        <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid #e4e7ec', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #e4e7ec', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            <IcArrowLeft /> Kembali
          </button>
          <div style={{ width: 1, height: 32, background: '#e4e7ec' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: sector.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{sector.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{sector.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Detail Monitoring — Sektor A</div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setLastRefresh(new Date())} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #e4e7ec', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#6B7280', fontSize: 12 }}>
              <IcRefresh /> Perbarui
            </button>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 'calc(90vh - 80px)', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>Suhu Real-Time</div>
              <TempGauge value={temp} min={15} max={45} />
              <div className="badge badge-green" style={{ fontSize: 11 }}><IcCheck /> Dalam Rentang Normal</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <StatCard label="Kelembapan" value="65%" sub="Kondisi baik" icon={<IcDroplets size={16} />} color="#1565C0" bg="#e3f0ff" />
                <StatCard label="Populasi Aktif" value="1.240" sub="Ekor hidup" icon={<span style={{ fontSize: 14 }}>🐓</span>} color="#E65100" bg="#fff3e0" />
                <StatCard label="Level Pakan" value={`${feedLevel}%`} sub="Perlu isi ulang" icon={<span style={{ fontSize: 14 }}>🌾</span>} color="#795548" bg="#f9f5f3" />
                <StatCard label="Suhu Luar" value="31°C" sub="Cuaca panas" icon={<IcThermometer size={16} />} color="#C62828" bg="#ffebee" />
              </div>

              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Panel Kontrol</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Kontrol Pemberian Pakan Otomatis', desc: feedAuto ? 'Aktif — jadwal 06:00 & 17:00' : 'Nonaktif — mode manual', val: feedAuto, set: setFeedAuto, icon: '🌾' },
                    { label: 'Monitor Air Minum Otomatis', desc: drinkAuto ? 'Aktif — pengisian otomatis' : 'Nonaktif — mode manual', val: drinkAuto, set: setDrinkAuto, icon: '💧' },
                    { label: 'Kipas Exhaust', desc: fanOn ? 'Menyala — ventilasi aktif' : 'Mati', val: fanOn, set: setFanOn, icon: '🌬️' },
                  ].map(ctrl => (
                    <div key={ctrl.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 8, gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{ctrl.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ctrl.label}</div>
                          <div style={{ fontSize: 11, color: ctrl.val ? '#2E7D32' : '#9CA3AF' }}>{ctrl.desc}</div>
                        </div>
                      </div>
                      <Toggle isOn={ctrl.val} onChange={ctrl.set} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Grafik Suhu Harian</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Data hari ini — diperbarui setiap menit</div>
              </div>
              <div className="badge badge-amber"><IcActivity size={11} /> Batas atas: 35°C</div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={tempData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E65100" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E65100" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[24, 36]} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="suhu" stroke="#E65100" strokeWidth={2} fill="url(#tempGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Monitor Air Minum</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Level Tangki</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#1565C0' }}>{waterLevel}%</span>
                </div>
                <ProgressBar value={waterLevel} color="#1565C0" />
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Kapasitas: 500L</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>Kualitas Air</div>
                <div className="badge badge-green" style={{ marginBottom: 4 }}><IcCheck /> Layak Minum</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>TDS: 240 ppm • pH: 7.1</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>Konsumsi Hari Ini</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>148 L</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Rata-rata: ~0.12L/ekor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GenericDetail({ sector, onBack }: { sector: Sector; onBack: () => void }) {
  const [pump, setPump] = useState(true)
  const [auto, setAuto] = useState(true)

  const configs: Record<SectorId, { metrics: { label: string; value: string; color: string }[]; ctrl1: string; ctrl2: string }> = {
    kandang: { metrics: [], ctrl1: '', ctrl2: '' },
    kolam: {
      metrics: [
        { label: 'pH Air', value: '7.2', color: '#1565C0' },
        { label: 'Suhu Air', value: '26°C', color: '#E65100' },
        { label: 'Kekeruhan', value: 'Normal', color: '#2E7D32' },
        { label: 'Oksigen Terlarut', value: '7.8 mg/L', color: '#2E7D32' },
      ],
      ctrl1: 'Aerator Kolam', ctrl2: 'Pompa Sirkulasi',
    },
    hidroponik: {
      metrics: [
        { label: 'Level Nutrisi', value: '80%', color: '#2E7D32' },
        { label: 'Aliran Air', value: 'Lancar', color: '#2E7D32' },
        { label: 'EC Larutan', value: '2.4 mS/cm', color: 'var(--text-secondary)' },
        { label: 'Level Tangki', value: '85%', color: '#1565C0' },
      ],
      ctrl1: 'Pompa Sirkulasi', ctrl2: 'Pengatur Nutrisi',
    },
    irigasi: {
      metrics: [
        { label: 'Kelembapan Tanah', value: '45%', color: '#E65100' },
        { label: 'Status', value: 'Kering', color: '#C62828' },
        { label: 'Lahan Total', value: '2.5 Ha', color: 'var(--text-secondary)' },
        { label: 'Terakhir Irigasi', value: '8 jam lalu', color: '#6B7280' },
      ],
      ctrl1: 'Sprinkler Otomatis', ctrl2: 'Irigasi Tetes',
    },
  }
  const cfg = configs[sector.id.split('_')[0] as SectorId] || configs['irigasi'] // Fallback if custom ID

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
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 24, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Panel Kontrol</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: cfg.ctrl1, val: pump, set: setPump },
                { label: cfg.ctrl2, val: auto, set: setAuto },
              ].map(ctrl => (
                <div key={ctrl.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{ctrl.label}</div>
                    <div style={{ fontSize: 12, color: ctrl.val ? '#2E7D32' : '#9CA3AF', marginTop: 1 }}>{ctrl.val ? 'Aktif' : 'Nonaktif'}</div>
                  </div>
                  <Toggle isOn={ctrl.val} onChange={ctrl.set} />
                </div>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}