import React from 'react'

export function Toggle({ isOn, onChange, label }: { isOn: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div className="toggle-wrap" onClick={() => onChange(!isOn)}>
        <div className="toggle-track" style={{ background: isOn ? '#10b981' : 'var(--border-color)' }} />
        <div className="toggle-thumb" style={{ transform: isOn ? 'translateX(20px)' : 'translateX(0)', background: '#fff' }} />
      </div>
      {label && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>}
    </label>
  )
}

export function ProgressBar({ value, max = 100, color = '#2E7D32' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function TempGauge({ value, min = 0, max = 50 }: { value: number; min?: number; max?: number }) {
  const pct = (value - min) / (max - min)
  const angle = pct * 180 - 90
  const r = 60
  const cx = 70, cy = 70
  const arcLen = Math.PI * r
  const dashOffset = arcLen * (1 - pct)
  const color = value > 35 ? '#C62828' : value > 30 ? '#E65100' : '#2E7D32'

  const needleX = cx + r * 0.75 * Math.cos(((angle - 90) * Math.PI) / 180)
  const needleY = cy + r * 0.75 * Math.sin(((angle - 90) * Math.PI) / 180)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="140" height="90" viewBox="0 0 140 90">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#e4e7ec" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={arcLen} strokeDashoffset={dashOffset} className="gauge-arc" />
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={color} />
        <text x={cx - r - 4} y={cy + 16} textAnchor="middle" fontSize="10" fill="#9CA3AF">{min}°</text>
        <text x={cx + r + 4} y={cy + 16} textAnchor="middle" fontSize="10" fill="#9CA3AF">{max}°</text>
      </svg>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}°C</div>
      <div style={{ fontSize: 12, color: '#6B7280' }}>Suhu Kandang</div>
    </div>
  )
}

export function StatCard({ label, value, sub, icon, color = '#2E7D32', bg = '#dcf0de' }: { label: string; value: string; sub?: string; icon: React.ReactNode; color?: string; bg?: string }) {
  return (
    <div className="stat-chip" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginTop: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid #e4e7ec', borderRadius: 8, padding: '8px 12px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ color: '#E65100' }}>Suhu: <strong>{Number(payload[0]?.value).toFixed(1)}°C</strong></div>
    </div>
  )
}
