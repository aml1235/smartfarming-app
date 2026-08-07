const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/SectorDashboard.tsx', 'utf8');

// 1. Remove 5th metric card (Sisa Pakan) and change grid to 4 columns in index.css
// In SectorDashboard.tsx:
code = code.replace(/<div style=\{\{ \.\.\.card \}\}>\s*<div style=\{\{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 \}\}>\s*<span style=\{\{ fontSize: 22 \}\}>🌾<\/span>[\s\S]*?<ProgressBar value=\{sisPakan\} color=\{sisPakan < 20 \? '#dc2626' : '#F59E0B'\} \/>\s*\{jrkPakan !== '--' && <div style=\{\{ fontSize: 10, color: 'var\(--text-secondary\)', marginTop: 4 \}\}>📏 Jarak: \{jrkPakan\} cm<\/div>\}\s*<\/div>/, '');

// 2. Remove "ADC raw"
code = code.replace(/<div style=\{\{ fontSize: 10, color: 'var\(--text-secondary\)' \}\}>ADC raw<\/div>/, '');

// 3. Add Normal limits to the 4 cards
const suhuCard = `<div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>🌡️</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Suhu</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: suhuColor }}>{suhu}<span style={{ fontSize: 13 }}>°C</span></div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Normal: 28-32°C</div>
        </div>`;
code = code.replace(/<div style=\{\{ \.\.\.card, textAlign: 'center' \}\}>\s*<div style=\{\{ fontSize: 26, marginBottom: 4 \}\}>🌡️<\/div>[\s\S]*?<div style=\{\{ fontSize: 26, fontWeight: 800, color: suhuColor \}\}>\{suhu\}<span style=\{\{ fontSize: 13 \}\}>°C<\/span><\/div>\s*<\/div>/, suhuCard);

const humCard = `<div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>💧</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Kelembapan</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1565C0' }}>{lembap}<span style={{ fontSize: 13 }}>%</span></div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Normal: 50-70%</div>
        </div>`;
code = code.replace(/<div style=\{\{ \.\.\.card, textAlign: 'center' \}\}>\s*<div style=\{\{ fontSize: 26, marginBottom: 4 \}\}>💧<\/div>[\s\S]*?<div style=\{\{ fontSize: 26, fontWeight: 800, color: '#1565C0' \}\}>\{lembap\}<span style=\{\{ fontSize: 13 \}\}>%<\/span><\/div>\s*<\/div>/, humCard);

const amoniaCard = `<div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>🌬️</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Amonia</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: amoniaColor }}>{amonia}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Normal: < 15</div>
        </div>`;
code = code.replace(/<div style=\{\{ \.\.\.card, textAlign: 'center' \}\}>\s*<div style=\{\{ fontSize: 26, marginBottom: 4 \}\}>🌬️<\/div>[\s\S]*?<div style=\{\{ fontSize: 26, fontWeight: 800, color: amoniaColor \}\}>\{amonia\}<\/div>\s*<\/div>/, amoniaCard);

const waterCard = `<div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>🌊</span>
            <div><div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Level Air</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: levelAir < 20 ? '#dc2626' : '#1565C0' }}>{levelAir}<span style={{ fontSize: 12 }}>%</span></div></div>
          </div>
          <ProgressBar value={levelAir} color={levelAir < 20 ? '#dc2626' : '#1565C0'} />
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8 }}>Normal: > 20%</div>
        </div>`;
code = code.replace(/<div style=\{card\}>\s*<div style=\{\{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 \}\}>\s*<span style=\{\{ fontSize: 22 \}\}>🌊<\/span>[\s\S]*?<ProgressBar value=\{levelAir\} color=\{levelAir < 20 \? '#dc2626' : '#1565C0'\} \/>\s*<\/div>/, waterCard);


// 4. Change Conveyor Kotoran to Conveyor Pakan
code = code.replace(/'Conveyor Kotoran'/g, "'Conveyor Pakan'");
code = code.replace(/>Conveyor Kotoran</g, ">Conveyor Pakan<");
code = code.replace(/Conveyor — Jam mulai/g, "Otomasi Conveyor & Pakan");
code = code.replace(/Satu siklus maju–jeda–mundur per jadwal/g, "Waktu nyala disamakan");


// 5. Rearrange Auto tab and combine Conveyor & Feeder schedules
// Remove the separate Auto Pakan block and Auto Pompa block, and rewrite them.
const autoConveyorPakan = `
              {/* Auto Pompa */}
              <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: 12, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>💧</span><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Otomasi Pompa Air</div><div style={{ fontSize: 11, color: pompaAuto ? '#2E7D32' : '#9CA3AF' }}>{pompaAuto ? 'Sensor mengatur otomatis' : 'Mode manual'}</div></div></div>
                <Toggle isOn={pompaAuto} onChange={togglePompaAuto}/>
              </div>
              {/* Auto Conveyor & Pakan */}
              <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ fontSize: 18 }}>⚙️🌾</span><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Otomasi Conveyor & Pakan</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Waktu nyala disamakan</div></div></div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>JADWAL 1 (JAM MULAI)</div><input type="time" value={cv1On} style={inp} onChange={e => { const val = e.target.value; setCv1On(val); cfg('conveyoron', val); setFeedTime1(val); cfg('feedtime1', val); }}/></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>LAMA BUKA PAKAN (DTK)</div><input type="number" min="1" max="120" value={feedDur} style={inp} onChange={e => { setFeedDur(e.target.value); cfg('feedduration', e.target.value) }}/></div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: cv2En ? 10 : 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Aktifkan jadwal 2</span>
                    <Toggle isOn={cv2En} onChange={() => { const n = !cv2En; setCv2En(n); cfg('conveyor2en', n ? '1' : '0'); setFeedTime2En(n); cfg('feedtime2en', n ? '1' : '0') }}/>
                  </div>
                  {cv2En && <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>JADWAL 2 (JAM MULAI)</div><input type="time" value={cv2On} style={inp} onChange={e => { const val = e.target.value; setCv2On(val); cfg('conveyor2on', val); setFeedTime2(val); cfg('feedtime2', val); }}/></div>
                  </div>}
                </div>
              </div>
`;

code = code.replace(/\{\/\* Auto Conveyor \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\)\s*\}\s*<\/div>\s*<\/div>/, autoConveyorPakan + '</div>\n          )}\n        </div>\n      </div>');


// Update index.css for 4 cards
let indexCss = fs.readFileSync('frontend/src/index.css', 'utf8');
indexCss = indexCss.replace(/\.kandang-metrics-grid \{\s*display: grid;\s*grid-template-columns: repeat\(5, 1fr\);/g, '.kandang-metrics-grid {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);');
fs.writeFileSync('frontend/src/index.css', indexCss, 'utf8');


fs.writeFileSync('frontend/src/components/SectorDashboard.tsx', code, 'utf8');
console.log('Success');
