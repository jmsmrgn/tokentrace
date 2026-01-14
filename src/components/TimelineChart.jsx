import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { MODEL_META, MODELS } from '../data/mockData'

const MODEL_ORDER = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'llama-3.1-70b']

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div style={{
      background: '#16191F', border: '1px solid #252830',
      borderRadius: '8px', padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      minWidth: '180px',
    }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>
        {formatDate(label)}
      </div>
      {[...payload].reverse().map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Syne', sans-serif", fontSize: '11px', color: '#8B909A' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color, display: 'inline-block' }} />
            {MODEL_META[p.dataKey]?.label ?? p.dataKey}
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#F1F2F4' }}>
            {p.value}
          </span>
        </div>
      ))}
      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #1E2028', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', color: '#6B7280' }}>Total</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#E8A020' }}>{total}</span>
      </div>
    </div>
  )
}

export default function TimelineChart({ data, loaded }) {
  const [visible, setVisible] = useState(
    Object.fromEntries(MODEL_ORDER.map(m => [m, true]))
  )

  function toggleModel(m) {
    setVisible(v => ({ ...v, [m]: !v[m] }))
  }

  // Format x-axis: show fewer ticks
  const tickData = useMemo(() => {
    if (!data) return []
    return data.filter((_, i) => i % 5 === 0).map(d => d.date)
  }, [data])

  if (!data) return null

  return (
    <div
      className={`card anim-fade-up delay-2`}
      style={{ padding: '20px 20px 16px', opacity: loaded ? undefined : 0 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div className="section-label">Call Volume</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#F1F2F4', marginTop: '4px' }}>
            Daily Requests · 30-Day Timeline
          </div>
        </div>
        {/* Model toggles */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {MODEL_ORDER.map(m => {
            const meta = MODEL_META[m]
            return (
              <button
                key={m}
                onClick={() => toggleModel(m)}
                className="filter-btn"
                style={{
                  '--model-color': meta.color,
                  '--model-bg': meta.bg,
                  ...(visible[m] ? {
                    borderColor: meta.color,
                    color: meta.color,
                    background: meta.bg,
                  } : {}),
                }}
              >
                {meta.label.split(' ')[0]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              {MODEL_ORDER.map(m => (
                <linearGradient key={m} id={`grad-${m.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"   stopColor={MODEL_META[m].color} stopOpacity={0.25} />
                  <stop offset="95%"  stopColor={MODEL_META[m].color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="date"
              ticks={tickData}
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: '#3D4149' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: '#3D4149' }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} />
            {MODEL_ORDER.map((m, i) => (
              <Area
                key={m}
                type="monotone"
                dataKey={m}
                stackId="stack"
                stroke={MODEL_META[m].color}
                strokeWidth={visible[m] ? 1.5 : 0}
                fill={`url(#grad-${m.replace(/[^a-z0-9]/gi,'')})`}
                fillOpacity={visible[m] ? 1 : 0}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
        {MODEL_ORDER.map(m => (
          <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: visible[m] ? 1 : 0.35, transition: 'opacity 0.2s' }}>
            <div style={{ width: '10px', height: '3px', borderRadius: '2px', background: MODEL_META[m].color }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', color: '#6B7280' }}>
              {MODEL_META[m].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
