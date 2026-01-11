const METRICS = [
  {
    key: 'totalCalls', label: 'Total Calls', icon: '◈',
    format: v => v.toLocaleString(), unit: '',
    desc: 'Across all models',
  },
  {
    key: 'avgLatency', label: 'Avg Latency', icon: '⚡',
    format: v => Math.round(v).toLocaleString(), unit: 'ms',
    desc: 'End-to-end response time',
  },
  {
    key: 'totalCost', label: 'Total Cost', icon: '$',
    format: v => `$${v.toFixed(2)}`, unit: '',
    desc: 'All models, 30 days',
  },
  {
    key: 'errorRate', label: 'Error Rate', icon: '⚠',
    format: v => `${(v * 100).toFixed(2)}`, unit: '%',
    desc: 'Failed / total calls',
  },
  {
    key: 'avgQuality', label: 'Avg Quality', icon: '◆',
    format: v => v.toFixed(3), unit: '',
    desc: 'Quality score (0–1)',
  },
]

export default function KPIStrip({ data, loaded }) {
  if (!data) return null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '12px',
    }}>
      {METRICS.map((m, i) => {
        const kpi = data[m.key]
        if (!kpi) return null

        const delta   = kpi.delta ?? 0
        const isPct   = m.key === 'errorRate'
        const pctVal  = Math.abs(delta * 100).toFixed(1)
        const isUp    = delta > 0
        const isGood  = kpi.isPositive

        return (
          <div
            key={m.key}
            className={`card card-interactive anim-fade-up delay-${i}`}
            style={{
              padding: '22px 22px 18px',
              display: 'flex', flexDirection: 'column',
              gap: '12px',
              opacity: loaded ? undefined : 0,
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4B5263',
              }}>
                {m.label}
              </div>
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono', monospace", fontSize: '13px',
                color: '#E8A020',
              }}>
                {m.icon}
              </div>
            </div>

            {/* Value */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span className="font-mono amber-glow" style={{ fontSize: '28px', fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {m.format(kpi.value)}
                </span>
                {m.unit && (
                  <span className="font-mono" style={{ fontSize: '13px', color: '#6B7280', fontWeight: 400 }}>
                    {m.unit}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#2E3140', marginTop: '4px' }}>
                {m.desc}
              </div>
            </div>

            {/* Trend */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px', borderRadius: '6px',
              background: isGood ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${isGood ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`,
            }}>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: '12px',
                color: isGood ? '#4ADE80' : '#F87171',
              }}>
                {isUp ? '↑' : '↓'} {pctVal}%
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#3D4149' }}>
                vs prev 7d
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
