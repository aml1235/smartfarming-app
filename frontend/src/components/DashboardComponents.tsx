import React from 'react'
import { Sector, SectorId } from '../types'
import { STATUS_MAP } from '../constants'
import { ProgressBar } from './UIComponents'
import { IcCheck, IcChevronRight } from './Icons'
import { AnimatedWaterTank, AnimatedBatteryTank, AnimatedThermometer } from './AnimatedTanks'

import { API_URL } from '../constants'
import { useLanguage } from '../i18n'

export function OverviewMetrics({ sector }: { sector: any }) {
  const { t } = useLanguage();
  const [hydroData, setHydroData] = React.useState({ waterLevel: 0, temp: 0, humidity: 0, light: 0 })
  const [kandangData, setKandangData] = React.useState({ temp: 0, humidity: 0, waterLevel: 0, ammonia: 0, aki: 0, soc: 0, lvd: '', pakan: 0, tangki: '' })
  
  const id = sector.sector_id || sector.id;
  const name = String(sector.name || '').toLowerCase();
  const unit = String(sector.unit || '').toLowerCase();

  const effectiveId = name.includes('hidro') || unit === 'tanaman' ? 'hidroponik' 
                    : name.includes('kandang') || unit === 'peternakan' ? 'kandang'
                    : name.includes('kolam') || unit === 'perikanan' ? 'kolam'
                    : 'irigasi';

  React.useEffect(() => {
    if (effectiveId === 'hidroponik' || effectiveId === 'kandang') {
      const fetchLatest = async () => {
        try {
          let latest: any = {};
          try {
            const sectorRes = await fetch(`${API_URL}/api/sectors`)
            const sectors = await sectorRes.json()
            const sectorData = sectors.find((s: any) => s.sector_id === id || s.id === id)
            if (sectorData && sectorData.metrics) {
              if (typeof sectorData.metrics === 'string') {
                try { latest = JSON.parse(sectorData.metrics) } catch(e) {}
              } else {
                latest = { ...sectorData.metrics }
              }
            }
          } catch(e) {}

          const res = await fetch(`${API_URL}/api/sectors/${id}/logs`)
          const data = await res.json()
          if (data && data.length > 0) {
            const reversedData = [...data].reverse();
            const temp = reversedData.find((d: any) => d.temperature && Number(d.temperature) > 0)?.temperature || latest.temperature || 0;
            const hum = reversedData.find((d: any) => d.humidity && Number(d.humidity) > 0)?.humidity || latest.humidity || 0;
            const validAmonia = reversedData.find((d: any) => (d.ammonia && Number(d.ammonia) > 0) || (d.mq135 && Number(d.mq135) > 0));
            const ammonia = validAmonia?.ammonia || validAmonia?.mq135 || latest.ammonia || latest.mq135 || 0;
            const validWater = reversedData.find((d: any) => (d.waterLevel && Number(d.waterLevel) > 0) || (d.water_level && Number(d.water_level) > 0));
            let waterLevel = latest.waterLevel || latest.water_level || 0;
            if (Number(waterLevel) === 0 && validWater) {
               waterLevel = validWater.waterLevel || validWater.water_level;
            }
            const validLight = reversedData.find((d: any) => d.lightLevel || d.light_level);
            const lightLevel = validLight?.lightLevel || validLight?.light_level || latest.lightLevel || latest.light_level || 0;

            if (effectiveId === 'hidroponik') {
              setHydroData({ waterLevel, temp, humidity: hum, light: lightLevel })
            } else if (effectiveId === 'kandang') {
              setKandangData({ 
                temp, 
                humidity: hum, 
                waterLevel, 
                ammonia,
                aki: latest.aki || 0,
                soc: latest.soc || 0,
                lvd: latest.lvd || '',
                pakan: latest.level || 0,
                tangki: latest.tangki || ''
              })
            }
          }
        } catch (err) {
          console.error(err)
        }
      }
      fetchLatest()
      const interval = setInterval(fetchLatest, 10000)
      return () => clearInterval(interval)
    }
  }, [id, effectiveId])

  const metrics: Record<SectorId, React.ReactNode> = {
    kandang: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {id === 'sec-03' ? (
            <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AnimatedThermometer temperature={kandangData.temp} size={36} />
              <div>
                <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('temp')}</div>
                <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 14, color: kandangData.temp > 32 ? '#dc2626' : kandangData.temp > 28 ? '#d97706' : '#059669', marginTop: 1 }}>{kandangData.temp}°C</div>
              </div>
            </div>
          ) : (
            <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
              <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('temp')}</div>
              <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 18, color: '#E65100', marginTop: 1 }}>{kandangData.temp}°C</div>
            </div>
          )}
          <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
            <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('humidity')}</div>
            <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 18, color: '#1565C0', marginTop: 1 }}>{kandangData.humidity}%</div>
          </div>
        </div>
        
        {id === 'sec-03' ? (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AnimatedBatteryTank soc={kandangData.soc} aki={kandangData.aki} size={36} />
                <div>
                  <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('battery_status')}</div>
                  <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 13, color: kandangData.soc > 30 ? '#059669' : '#ef4444', marginTop: 1 }}>{kandangData.aki}V ({kandangData.soc}%)</div>
                </div>
              </div>
              <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
                <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>🌾 {t('feed_left')}</div>
                <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 14, color: kandangData.pakan > 20 ? '#d97706' : '#ef4444', marginTop: 1 }}>{kandangData.pakan}%</div>
              </div>
              <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AnimatedWaterTank status={kandangData.tangki} percentage={kandangData.waterLevel} size={36} />
                <div>
                  <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('water_tank_status')}</div>
                  <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 13, color: '#1565C0', marginTop: 1, textTransform: 'capitalize' }}>{kandangData.tangki ? kandangData.tangki.toLowerCase() : t('medium').toLowerCase()}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
                <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Amonia</div>
                <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 18, color: '#059669', marginTop: 1 }}>{kandangData.ammonia}</div>
              </div>
            </div>
            <div>
              <div className="metric-row-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>💧 Level Air</span><span style={{ fontWeight: 600, color: '#1565C0' }}>{kandangData.waterLevel}%</span>
              </div>
              <ProgressBar value={kandangData.waterLevel} color="#1565C0" />
            </div>
          </>
        )}
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
            <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Suhu</div>
            <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 18, color: '#E65100', marginTop: 1 }}>{hydroData.temp}°C</div>
          </div>
          <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
            <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Kelembapan</div>
            <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 18, color: '#1565C0', marginTop: 1 }}>{hydroData.humidity}%</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
            <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Cahaya</div>
            <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 18, color: '#F59E0B', marginTop: 1 }}>{hydroData.light} lux</div>
          </div>
          <div className="metric-box" style={{ flex: 1, borderRadius: 8, padding: '8px 12px' }}>
            <div className="metric-box-label" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Level Air</div>
            <div className="metric-box-val" style={{ fontWeight: 700, fontSize: 18, color: '#1565C0', marginTop: 1 }}>{hydroData.waterLevel}%</div>
          </div>
        </div>
      </div>
    ),
    irigasi: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px 0' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, fontStyle: 'italic' }}>Dalam Pengembangan Saja Dulu</div>
      </div>
    ),
  }
  return metrics[effectiveId as SectorId] || metrics['irigasi']
}

export function SectorCard({ sector, onOpen }: { sector: Sector & { metrics: React.ReactNode }; onOpen: () => void }) {
  const { t } = useLanguage();
  const { label, cls } = STATUS_MAP[sector.status]
  
  let translatedName = sector.name;
  if (sector.id === 'hidroponik') translatedName = t('sector_hidroponik');
  else if (sector.id === 'sec-02') translatedName = t('sector_kandang_unhan');
  else if (sector.id === 'sec-01') translatedName = t('sector_kandang_bengpuskomlek');

  let translatedUnit = sector.unit;
  if (sector.unit?.toLowerCase() === 'tanaman') translatedUnit = t('unit_tanaman');
  else if (sector.unit?.toLowerCase() === 'peternakan') translatedUnit = t('unit_peternakan');

  let translatedStatus = label;
  if (sector.status === 'baik') translatedStatus = t('status_baik');
  else if (sector.status === 'normal') translatedStatus = t('status_normal');
  else if (sector.status === 'peringatan') translatedStatus = t('status_waspada');
  else if (sector.status === 'kritis') translatedStatus = t('status_kritis');

  let translatedTime = sector.lastUpdate;
  if (translatedTime) {
    translatedTime = translatedTime.replace('Baru saja', t('just_now'))
                                   .replace('mnt lalu', t('mins_ago'))
                                   .replace('jam lalu', t('hours_ago'))
                                   .replace('hari lalu', t('days_ago'));
  }

  return (
    <div className="card card-clickable fade-up" onClick={onOpen} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 4, background: sector.color }} />
      <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: sector.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
            {sector.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{translatedName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{translatedUnit}</div>
          </div>
        </div>
        <div className={`badge ${cls}`}>{translatedStatus}</div>
      </div>
      <div style={{ padding: '0 20px 16px', flex: 1 }}>
        {sector.metrics}
      </div>
      <div className="card-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('updated')} {translatedTime}</span>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: 'none', background: sector.colorLight, color: sector.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
          onClick={e => { e.stopPropagation(); onOpen() }}
        >
          {t('manage')} <IcChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
