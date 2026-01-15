import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { getBucketForLatency } from '../data/mockData'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#16191F', border: '1px solid #252830', borderRadius: '8px',
      padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
        {label} ms
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '14px', color: '#F1F2F4' }}>
        {payload[0].value.toLocaleString()} <span style={{ fontSize: '11px', color: '#6B7280' }}>calls</span>
      </div>
    </div>
  )
}

const PERCENTILE_STYLE = {
  p50: { color: '#E8A020', label: 'P50' },
  p90: { color: '#3B82F6', label: 'P90' },
  p99: { color: '#F87171', label: 'P99' },
}

export default function LatencyChart({ data, percentiles, loaded }) {
  if (!data || !percentiles) return null

  const maxCount = Math.max(...data.map(d => d.count))

  // Reference lines: which bucket index are the percentiles in?
  const p50bucket = getBucketForLatency(percentiles.p50)
  const p90bucket = getBucketForLatency(percentiles.p90)
  const p99bucket = getBucketForLatency(percentiles.p99)

  return (
    <div
      className={`card anim-fade-up delay-4`}
      style={{ padding: '20px 20px 16px', opacity: loaded ? undefined : 0 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div className="section-label">Performance</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#F1F2F4', marginTop: '4px' }}>
            Latency Distribution
          </div>
        </div>
        {/* Percentile badges */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {Object.entries(PERCENTILE_STYLE).map(([pct, ps]) => (
            <div key={pct} style={{
              fontFamily: "'DM Mono', monospace", fontSize: '11px',
              padding: '4px 10px', borderRadius: '6px',
              border: `1px solid ${ps.color}33`,
              background: `${ps.color}0D`,
              color: ps.color,
              display: 'flex', gap: '5px', alignItems: 'center',
            }}>
              <span style={{ opacity: 0.7 }}>{ps.label}</span>
              <span>{percentiles[pct].toLocaleString()}ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="18%">
            <CartesianGrid vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="label"
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((entry, index) => {
                const isP50 = index === p50bucket
                const isP90 = index === p90bucket
                const isP99 = index === p99bucket
                const highlight = isP99 ? '#F87171' : isP90 ? '#3B82F6' : isP50 ? '#E8A020' : '#3B82F6'
                const opacity   = isP99 || isP90 || isP50 ? 0.9 : 0.45
                return (
                  <Cell key={index} fill={highlight} fillOpacity={opacity} />
                )
              })}
            </Bar>
            {/* Percentile reference lines */}
            <ReferenceLine
              x={data[p50bucket]?.label}
              stroke="#E8A020"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={{ value: 'P50', position: 'top', fontSize: 9, fill: '#E8A020', fontFamily: "'DM Mono', monospace" }}
            />
            <ReferenceLine
              x={data[p90bucket]?.label}
              stroke="#3B82F6"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={{ value: 'P90', position: 'top', fontSize: 9, fill: '#3B82F6', fontFamily: "'DM Mono', monospace" }}
            />
            <ReferenceLine
              x={data[p99bucket]?.label}
              stroke="#F87171"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={{ value: 'P99', position: 'top', fontSize: 9, fill: '#F87171', fontFamily: "'DM Mono', monospace" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer insight */}
      <div style={{
        marginTop: '14px', padding: '10px 14px', borderRadius: '6px',
        background: '#0D0F14', border: '1px solid #181A22',
        display: 'flex', gap: '20px',
      }}>
        {[
          { label: 'P50', value: `${percentiles.p50.toLocaleString()} ms`, color: '#E8A020' },
          { label: 'P90', value: `${percentiles.p90.toLocaleString()} ms`, color: '#3B82F6' },
          { label: 'P99', value: `${percentiles.p99.toLocaleString()} ms`, color: '#F87171' },
          { label: 'Peak bucket', value: data.find(d => d.count === maxCount)?.label, color: '#6B7280' },
        ].map(item => (
          <div key={item.label}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', color: '#3D4149', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {item.label}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: item.color, marginTop: '2px' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
