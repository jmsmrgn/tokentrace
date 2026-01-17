import { useState } from 'react'

// Color interpolation: black → dark red → bright red
function errorColor(rate) {
  if (rate === 0) return '#0D0F14'
  const t = Math.min(rate / 0.40, 1) // normalize: 40% = max color intensity
  // Interpolate #111318 → #7A1F1F → #C62828
  const r = Math.round(17  + t * (198 - 17))
  const g = Math.round(19  + t * (31  - 19))
  const b = Math.round(24  + t * (40  - 24))
  return `rgb(${r},${g},${b})`
}

function errorBorder(rate) {
  if (rate === 0) return '#181A22'
  const alpha = Math.min(rate / 0.3, 1) * 0.5
  return `rgba(220,40,40,${alpha})`
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function fmt12h(h) {
  if (h === 0)  return '12a'
  if (h === 12) return '12p'
  return h < 12 ? `${h}a` : `${h-12}p`
}

function CellTooltip({ day, hour, errors, total, rate }) {
  return (
    <div style={{
      position: 'absolute', zIndex: 100, bottom: 'calc(100% + 8px)', left: '50%',
      transform: 'translateX(-50%)',
      background: '#16191F', border: '1px solid #252830', borderRadius: '7px',
      padding: '8px 12px', whiteSpace: 'nowrap',
      boxShadow: '0 6px 24px rgba(0,0,0,0.7)',
      pointerEvents: 'none',
    }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
        {day} · {fmt12h(hour)}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: rate > 0 ? '#F87171' : '#4ADE80' }}>
        {errors} errors / {total} calls
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
        {(rate * 100).toFixed(1)}% error rate
      </div>
    </div>
  )
}

export default function ErrorHeatmap({ data, loaded }) {
  const [hovered, setHovered] = useState(null) // { di, hi }

  if (!data) return null

  // Compute max error rate for scale info
  let maxRate = 0
  data.forEach(day => day.hours.forEach(h => { if (h.rate > maxRate) maxRate = h.rate }))

  // Shown hour labels (every 3 hours)
  const shownHours = [0, 3, 6, 9, 12, 15, 18, 21]

  return (
    <div
      className={`card anim-fade-up delay-6`}
      style={{ padding: '20px 24px 18px', opacity: loaded ? undefined : 0 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <div className="section-label">Reliability</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#F1F2F4', marginTop: '4px' }}>
            Error Rate Heatmap · Last 7 Days
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#3D4149', marginTop: '3px' }}>
            Cell intensity = error density by hour
          </div>
        </div>
        {/* Color scale */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#3D4149' }}>0%</span>
          <div style={{
            width: '80px', height: '8px', borderRadius: '4px',
            background: 'linear-gradient(to right, #0D0F14, #7A1F1F, #C62828)',
            border: '1px solid #1E2028',
          }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#F87171' }}>
            {(maxRate * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Hour labels row */}
      <div style={{ display: 'flex', marginBottom: '4px', paddingLeft: '40px' }}>
        {HOURS.map(h => (
          <div key={h} style={{
            flex: 1, textAlign: 'center',
            fontFamily: "'DM Mono', monospace", fontSize: '9px',
            color: shownHours.includes(h) ? '#3D4149' : 'transparent',
            lineHeight: '16px',
          }}>
            {fmt12h(h)}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {data.map((day, di) => (
          <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Day label */}
            <div style={{
              width: '34px', flexShrink: 0, textAlign: 'right',
              fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#4B5263',
              lineHeight: '18px',
            }}>
              {day.dayLabel}
            </div>
            {/* Hour cells */}
            <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
              {day.hours.map((cell, hi) => (
                <div
                  key={hi}
                  className="heatmap-cell"
                  style={{
                    flex: 1,
                    background: errorColor(cell.rate),
                    border: `1px solid ${errorBorder(cell.rate)}`,
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHovered({ di, hi })}
                  onMouseLeave={() => setHovered(null)}
                >
                  {hovered?.di === di && hovered?.hi === hi && (
                    <CellTooltip
                      day={day.dayLabel}
                      hour={hi}
                      errors={cell.errors}
                      total={cell.total}
                      rate={cell.rate}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '24px' }}>
        {(() => {
          let totalErrors = 0, totalCalls = 0
          let peakDay = '', peakDayRate = 0
          let peakHour = 0, peakHourRate = 0

          data.forEach(day => {
            let dayErr = 0, dayTotal = 0
            day.hours.forEach(h => {
              totalErrors += h.errors
              totalCalls  += h.total
              dayErr += h.errors; dayTotal += h.total
              if (h.rate > peakHourRate) { peakHourRate = h.rate; peakHour = h.hour }
            })
            const dr = dayTotal > 0 ? dayErr / dayTotal : 0
            if (dr > peakDayRate) { peakDayRate = dr; peakDay = day.dayLabel }
          })
          const overallRate = totalCalls > 0 ? totalErrors / totalCalls : 0

          return [
            { label: '7-day error rate', value: `${(overallRate * 100).toFixed(2)}%`, color: overallRate > 0.05 ? '#F87171' : '#4ADE80' },
            { label: 'Peak error day',   value: peakDay, color: '#E8A020' },
            { label: 'Peak error hour',  value: fmt12h(peakHour), color: '#E8A020' },
            { label: 'Total errors',     value: totalErrors.toLocaleString(), color: '#F87171' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', color: '#3D4149', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.label}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: item.color, marginTop: '2px' }}>
                {item.value}
              </div>
            </div>
          ))
        })()}
      </div>
    </div>
  )
}
