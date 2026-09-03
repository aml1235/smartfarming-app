import React from 'react'

interface WaterTankProps {
  status?: string // 'KOSONG' | 'SEDANG' | 'PENUH' | numeric string
  percentage?: number // 0 - 100
  size?: number // width/height in px
  variant?: 'icon' | 'compact' | 'card'
  subtext?: string
}

interface BatteryProps {
  soc?: number | string // State of Charge e.g. 87, '87', 'KOSONG', 'SEDANG'
  aki?: number | string // Voltage e.g. 12.55 or '12.55'
  lvd?: string
  size?: number
  variant?: 'icon' | 'compact' | 'card'
  isCharging?: boolean
}

/** Helper to parse water level percentage from status or explicit percentage */
function getWaterLevelPercentage(status?: string, percentage?: number): { pct: number; label: string; state: 'empty' | 'medium' | 'full' } {
  if (percentage !== undefined && percentage !== null && !isNaN(percentage)) {
    const clamped = Math.min(100, Math.max(0, percentage))
    const state = clamped <= 20 ? 'empty' : clamped <= 60 ? 'medium' : 'full'
    let label = `${clamped.toFixed(0)}%`
    if (status && status !== '--' && isNaN(Number(status))) {
      label = `${status} (${clamped.toFixed(0)}%)`
    }
    return { pct: clamped, label, state }
  }

  if (!status || status === '--') {
    return { pct: 0, label: '--', state: 'empty' }
  }

  const upper = status.trim().toUpperCase()
  if (upper === 'KOSONG' || upper === 'EMPTY') {
    return { pct: 8, label: 'KOSONG', state: 'empty' }
  }
  if (upper === 'SEDANG' || upper === 'MEDIUM' || upper === 'HALF') {
    return { pct: 50, label: 'SEDANG', state: 'medium' }
  }
  if (upper === 'PENUH' || upper === 'FULL') {
    return { pct: 90, label: 'PENUH', state: 'full' }
  }

  const parsed = parseFloat(status)
  if (!isNaN(parsed)) {
    const clamped = Math.min(100, Math.max(0, parsed))
    const state = clamped <= 20 ? 'empty' : clamped <= 60 ? 'medium' : 'full'
    return { pct: clamped, label: `${clamped.toFixed(0)}%`, state }
  }

  return { pct: 50, label: upper, state: 'medium' }
}

/** Helper to parse battery SOC percentage */
function getBatteryPercentage(soc?: number | string): { pct: number; label: string; state: 'empty' | 'medium' | 'full' } {
  if (soc === undefined || soc === null || soc === '--' || soc === '') {
    return { pct: 0, label: '--', state: 'empty' }
  }

  if (typeof soc === 'number' && !isNaN(soc)) {
    const clamped = Math.min(100, Math.max(0, soc))
    const state = clamped <= 20 ? 'empty' : clamped <= 60 ? 'medium' : 'full'
    return { pct: clamped, label: `${clamped.toFixed(0)}%`, state }
  }

  const upper = String(soc).trim().toUpperCase()
  if (upper === 'KOSONG' || upper === 'KRITIS' || upper === 'EMPTY') {
    return { pct: 10, label: upper, state: 'empty' }
  }
  if (upper === 'SEDANG' || upper === 'MEDIUM') {
    return { pct: 50, label: upper, state: 'medium' }
  }
  if (upper === 'PENUH' || upper === 'FULL' || upper === 'NORMAL') {
    return { pct: 90, label: upper, state: 'full' }
  }

  const parsed = parseFloat(String(soc))
  if (!isNaN(parsed)) {
    const clamped = Math.min(100, Math.max(0, parsed))
    const state = clamped <= 20 ? 'empty' : clamped <= 60 ? 'medium' : 'full'
    return { pct: clamped, label: `${clamped.toFixed(0)}%`, state }
  }

  return { pct: 75, label: upper, state: 'full' }
}

// ─── WATER TANK ANIMATED SVG COMPONENT ────────────────────────────────────────
export function AnimatedWaterTank({ status, percentage, size = 64, variant = 'icon', subtext }: WaterTankProps) {
  const { pct, label, state } = getWaterLevelPercentage(status, percentage)

  // Color scheme
  const theme = state === 'empty' ? {
    stroke: '#ef4444',
    fill1: '#ef4444',
    fill2: '#f87171',
    glow: 'rgba(239, 68, 68, 0.4)',
    text: '#dc2626',
    bgBadge: '#fee2e2'
  } : state === 'medium' ? {
    stroke: '#0284c7',
    fill1: '#0284c7',
    fill2: '#38bdf8',
    glow: 'rgba(2, 132, 199, 0.3)',
    text: '#0284c7',
    bgBadge: '#e0f2fe'
  } : {
    stroke: '#1d4ed8',
    fill1: '#1d4ed8',
    fill2: '#60a5fa',
    glow: 'rgba(29, 78, 216, 0.35)',
    text: '#1565C0',
    bgBadge: '#dbeafe'
  }

  // Calculate Y position for water surface in SVG (tank height is 80px inside 100px viewBox, from Y=15 to Y=95)
  const tankTop = 16
  const tankBottom = 92
  const tankHeight = tankBottom - tankTop
  const waterY = tankBottom - (pct / 100) * tankHeight

  const uniqueId = React.useId().replace(/:/g, '_')
  const clipId = `water-clip-${uniqueId}`

  if (variant === 'card') {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 14,
        border: `1px solid ${theme.stroke}44`,
        padding: '16px 18px',
        textAlign: 'center',
        boxShadow: `0 4px 16px ${theme.glow}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>
          Status Tangki Air
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '8px 0' }}>
          <AnimatedWaterTankSvg pct={pct} waterY={waterY} theme={theme} clipId={clipId} size={90} state={state} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: theme.text, marginTop: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
          {subtext || 'Air Untuk Minum'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <AnimatedWaterTankSvg pct={pct} waterY={waterY} theme={theme} clipId={clipId} size={size} state={state} />
    </div>
  )
}

function AnimatedWaterTankSvg({ pct, waterY, theme, clipId, size, state }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <style>{`
        @keyframes tankWaveA_${clipId} {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25px); }
          100% { transform: translateX(0); }
        }
        @keyframes tankWaveB_${clipId} {
          0% { transform: translateX(-20px); }
          50% { transform: translateX(5px); }
          100% { transform: translateX(-20px); }
        }
        @keyframes floatBubbleA_${clipId} {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-35px) scale(1.2); opacity: 0; }
        }
        @keyframes floatBubbleB_${clipId} {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          50% { opacity: 0.9; }
          100% { transform: translateY(-45px) scale(1.1); opacity: 0; }
        }
        @keyframes warningPulse_${clipId} {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>

      <defs>
        {/* Clip path inside the water tank cylinder */}
        <clipPath id={clipId}>
          <rect x="22" y="16" width="56" height="74" rx="8" ry="8" />
        </clipPath>

        {/* Gradient for liquid body */}
        <linearGradient id={`liquidGrad-${clipId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.fill2} stopOpacity="0.95" />
          <stop offset="100%" stopColor={theme.fill1} stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id={`tankGlass-${clipId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="25%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="80%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Outer tank shadow / glow */}
      {state === 'empty' && (
        <rect x="18" y="12" width="64" height="82" rx="12" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.4" style={{ animation: `warningPulse_${clipId} 1.5s infinite ease-in-out` }} />
      )}

      {/* Pipe Top Inlet Cap */}
      <rect x="42" y="6" width="16" height="10" rx="3" fill="#64748b" />
      <rect x="45" y="4" width="10" height="4" rx="1" fill="#475569" />

      {/* Main Glass Tank Container Background */}
      <rect x="20" y="14" width="60" height="78" rx="10" fill="#f8fafc" stroke={theme.stroke} strokeWidth="3" opacity="0.95" />

      {/* Liquid layer clipped inside tank */}
      <g clipPath={`url(#${clipId})`}>
        {/* Wave 2 (Background wave layer) */}
        <path
          d={`M -30 ${waterY} Q -5 ${waterY - 4} 20 ${waterY} T 70 ${waterY} T 120 ${waterY} V 100 H -30 Z`}
          fill={theme.fill2}
          opacity="0.55"
          style={{ animation: `tankWaveB_${clipId} 4s infinite ease-in-out` }}
        />

        {/* Wave 1 (Foreground wave layer) */}
        <path
          d={`M -30 ${waterY} Q -5 ${waterY + 4} 20 ${waterY} T 70 ${waterY} T 120 ${waterY} V 100 H -30 Z`}
          fill={`url(#liquidGrad-${clipId})`}
          style={{ animation: `tankWaveA_${clipId} 2.8s infinite ease-in-out` }}
        />

        {/* Floating Water Bubbles (if water level > 15%) */}
        {pct > 15 && (
          <>
            <circle cx="36" cy={waterY + 25} r="3" fill="#ffffff" opacity="0.7" style={{ animation: `floatBubbleA_${clipId} 2.5s infinite linear` }} />
            <circle cx="58" cy={waterY + 35} r="4" fill="#ffffff" opacity="0.6" style={{ animation: `floatBubbleB_${clipId} 3.2s infinite linear 0.7s` }} />
            <circle cx="48" cy={waterY + 15} r="2.5" fill="#ffffff" opacity="0.8" style={{ animation: `floatBubbleA_${clipId} 2s infinite linear 1.2s` }} />
          </>
        )}

        {/* Water Surface Highlight Shine */}
        <line x1="22" y1={waterY} x2="78" y2={waterY} stroke="#ffffff" strokeWidth="2.5" opacity="0.7" />
      </g>

      {/* Tank Measurement Level Tick Marks */}
      <g opacity="0.4" stroke="#475569" strokeWidth="1.5">
        <line x1="22" y1="32" x2="28" y2="32" /> {/* 75% */}
        <line x1="22" y1="53" x2="31" y2="53" /> {/* 50% */}
        <line x1="22" y1="74" x2="28" y2="74" /> {/* 25% */}
        {/* Right side ticks */}
        <line x1="72" y1="32" x2="78" y2="32" />
        <line x1="69" y1="53" x2="78" y2="53" />
        <line x1="72" y1="74" x2="78" y2="74" />
      </g>

      {/* Glass Tank Reflection Layer */}
      <rect x="20" y="14" width="60" height="78" rx="10" fill={`url(#tankGlass-${clipId})`} pointerEvents="none" />
      <rect x="20" y="14" width="60" height="78" rx="10" fill="none" stroke={theme.stroke} strokeWidth="2.5" />

      {/* Outlet Pipe at bottom */}
      <rect x="43" y="92" width="14" height="6" rx="2" fill="#64748b" />

      {/* Percentage Overlay Pill inside tank if compact */}
      <rect x="33" y="47" width="34" height="15" rx="7" fill="rgba(15, 23, 42, 0.7)" />
      <text x="50" y="58" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800" fontFamily="sans-serif">
        {pct.toFixed(0)}%
      </text>
    </svg>
  )
}

// ─── BATTERY TANK ANIMATED SVG COMPONENT ──────────────────────────────────────
export function AnimatedBatteryTank({ soc, aki, lvd, size = 64, variant = 'icon', isCharging }: BatteryProps) {
  const { pct, label, state } = getBatteryPercentage(soc)

  const voltage = aki !== undefined && aki !== '--' ? `${parseFloat(String(aki)).toFixed(1)}V` : null

  // Color scheme based on SOC
  const theme = state === 'empty' ? {
    stroke: '#ef4444',
    fill1: '#ef4444',
    fill2: '#f87171',
    glow: 'rgba(239, 68, 68, 0.4)',
    text: '#dc2626'
  } : state === 'medium' ? {
    stroke: '#f59e0b',
    fill1: '#d97706',
    fill2: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.35)',
    text: '#d97706'
  } : {
    stroke: '#10b981',
    fill1: '#059669',
    fill2: '#34d399',
    glow: 'rgba(16, 185, 129, 0.35)',
    text: '#059669'
  }

  // Calculate Y position for battery charge level inside SVG (battery body Y=20 to Y=88, height 68)
  const batTop = 22
  const batBottom = 86
  const batHeight = batBottom - batTop
  const fillY = batBottom - (pct / 100) * batHeight

  const uniqueId = React.useId().replace(/:/g, '_')
  const clipId = `bat-clip-${uniqueId}`

  if (variant === 'card') {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 14,
        border: `1px solid ${theme.stroke}44`,
        padding: '16px 18px',
        textAlign: 'center',
        boxShadow: `0 4px 16px ${theme.glow}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>
          Status Baterai (AKI)
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '8px 0' }}>
          <AnimatedBatteryTankSvg pct={pct} fillY={fillY} theme={theme} clipId={clipId} size={90} state={state} isCharging={isCharging || (aki !== undefined && parseFloat(String(aki)) > 0)} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: theme.text, marginTop: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
          {voltage ? `${voltage} — ${lvd || 'Normal: > 20%'}` : lvd || 'Normal: > 20%'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <AnimatedBatteryTankSvg pct={pct} fillY={fillY} theme={theme} clipId={clipId} size={size} state={state} isCharging={isCharging || (aki !== undefined && parseFloat(String(aki)) > 0)} />
    </div>
  )
}

function AnimatedBatteryTankSvg({ pct, fillY, theme, clipId, size, state, isCharging }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <style>{`
        @keyframes batPulse_${clipId} {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
        @keyframes energyShimmer_${clipId} {
          0% { transform: translateY(0); }
          100% { transform: translateY(-20px); }
        }
        @keyframes boltGlow_${clipId} {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 6px #f59e0b); }
        }
        @keyframes waveBat_${clipId} {
          0% { transform: translateX(0); }
          50% { transform: translateX(-15px); }
          100% { transform: translateX(0); }
        }
      `}</style>

      <defs>
        {/* Clip path inside battery body */}
        <clipPath id={clipId}>
          <rect x="25" y="22" width="50" height="64" rx="6" ry="6" />
        </clipPath>

        {/* Battery Liquid Energy Gradient */}
        <linearGradient id={`batGrad-${clipId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.fill2} stopOpacity="1" />
          <stop offset="100%" stopColor={theme.fill1} stopOpacity="0.9" />
        </linearGradient>

        {/* Metallic Casing Reflection */}
        <linearGradient id={`batReflect-${clipId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="80%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Alert Glow for Low Battery */}
      {state === 'empty' && (
        <rect x="20" y="16" width="60" height="74" rx="10" fill="none" stroke="#ef4444" strokeWidth="2.5" opacity="0.5" style={{ animation: `batPulse_${clipId} 1.2s infinite ease-in-out` }} />
      )}

      {/* Positive Anode Terminal Cap (+) */}
      <rect x="42" y="10" width="16" height="10" rx="3" fill="#475569" stroke={theme.stroke} strokeWidth="1.5" />
      <text x="50" y="17" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">+</text>

      {/* Battery Outer Glass/Metal Body */}
      <rect x="23" y="20" width="54" height="68" rx="8" fill="#f8fafc" stroke={theme.stroke} strokeWidth="3" />

      {/* Internal Energy Level Fill (Clipped) */}
      <g clipPath={`url(#${clipId})`}>
        {/* Animated Wave Top on Energy Level */}
        <path
          d={`M -20 ${fillY} Q 5 ${fillY - 3} 30 ${fillY} T 80 ${fillY} T 120 ${fillY} V 100 H -20 Z`}
          fill={theme.fill2}
          opacity="0.6"
          style={{ animation: `waveBat_${clipId} 3s infinite ease-in-out` }}
        />

        <path
          d={`M -20 ${fillY} Q 5 ${fillY + 3} 30 ${fillY} T 80 ${fillY} T 120 ${fillY} V 100 H -20 Z`}
          fill={`url(#batGrad-${clipId})`}
        />

        {/* Segmented Energy Cell Lines */}
        <g stroke="#ffffff" strokeWidth="1.5" opacity="0.3" strokeDasharray="3 3">
          <line x1="25" y1="38" x2="75" y2="38" />
          <line x1="25" y1="54" x2="75" y2="54" />
          <line x1="25" y1="70" x2="75" y2="70" />
        </g>
      </g>

      {/* Battery Casing Outline & Sheen */}
      <rect x="23" y="20" width="54" height="68" rx="8" fill={`url(#batReflect-${clipId})`} pointerEvents="none" />
      <rect x="23" y="20" width="54" height="68" rx="8" fill="none" stroke={theme.stroke} strokeWidth="2.5" />

      {/* Charging Lightning Bolt Icon Overlay */}
      {isCharging && (
        <g style={{ transformOrigin: '50px 52px', animation: `boltGlow_${clipId} 1.8s infinite ease-in-out` }}>
          <path
            d="M 53 34 L 41 54 H 51 L 47 70 L 61 48 H 50 Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Percentage Pill Text */}
      {!isCharging && (
        <>
          <rect x="33" y="47" width="34" height="15" rx="7" fill="rgba(15, 23, 42, 0.75)" />
          <text x="50" y="58" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800" fontFamily="sans-serif">
            {pct.toFixed(0)}%
          </text>
        </>
      )}
    </svg>
  )
}
