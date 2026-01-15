import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background: '#16191F', border: '1px solid #252830', borderRadius: '8px',
      padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      minWidth: '160px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: d.color }} />
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px', color: '#F1F2F4', fontWeight: 600 }}>
          {d.label}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {[
          { label: 'Avg Cost',    value: `$${d.avgCost.toFixed(4)}` },
          { label: 'Avg Quality', value: d.avgQuality.toFixed(3) },
          { label: 'Total Calls', value: d.totalCalls.toLocaleString() },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', color: '#6B7280' }}>{row.label}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#E8A020' }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Custom dot with model color + label
function CustomDot(props) {
  const { cx, cy, payload, r } = props
  if (!cx || !cy) return null
  return (
    <g>
      <circle
        cx={cx} cy={cy}
        r={r + 4}
        fill={payload.color}
        fillOpacity={0.12}
        stroke={payload.color}
        strokeWidth={0}
      />
      <circle
        cx={cx} cy={cy}
        r={r}
        fill={payload.color}
        fillOpacity={0.85}
        stroke={payload.color}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy - r - 10}
        textAnchor="middle"
        fill={payload.color}
        fontSize={11}
        fontFamily="'Syne', sans-serif"
        fontWeight={600}
      >
        {payload.label.split(' ')[0]}
      </text>
    </g>
  )
}

export default function CostScatter({ data, loaded }) {
  if (!data) return null

  // Find best (highest quality, lowest cost) = top-left quadrant
  const bestQuality = Math.max(...data.map(d => d.avgQuality))
  const lowestCost  = Math.min(...data.map(d => d.avgCost))

  return (
    <div
      className={`card anim-fade-up delay-5`}
      style={{ padding: '20px 20px 16px', opacity: loaded ? undefined : 0 }}
    >
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div className="section-label">Efficiency Analysis</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#F1F2F4', marginTop: '4px' }}>
          Cost vs. Quality Tradeoff
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#3D4149', marginTop: '3px' }}>
          Bubble size = call volume · Top-left = optimal
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" />
            <XAxis
              dataKey="avgCost"
              type="number"
              name="Avg Cost"
              domain={['auto', 'auto']}
              tickFormatter={v => `$${v.toFixed(3)}`}
              tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: '#3D4149' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Avg Cost / Call (USD)',
                position: 'insideBottom',
                offset: -2,
                fontSize: 10,
                fill: '#3D4149',
                fontFamily: "'Syne', sans-serif",
              }}
            />
            <YAxis
              dataKey="avgQuality"
              type="number"
              name="Quality"
              domain={[0.65, 1.0]}
              tickFormatter={v => v.toFixed(2)}
              tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: '#3D4149' }}
              axisLine={false}
              tickLine={false}
              width={38}
              label={{
                value: 'Avg Quality Score',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                fontSize: 10,
                fill: '#3D4149',
                fontFamily: "'Syne', sans-serif",
              }}
            />
            <ZAxis dataKey="totalCalls" range={[500, 2000]} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            {data.map(model => (
              <Scatter
                key={model.model}
                name={model.label}
                data={[model]}
                fill={model.color}
                shape={CustomDot}
                isAnimationActive={false}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / summary */}
      <div style={{
        marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px',
      }}>
        {data.map(model => (
          <div key={model.model} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 10px', borderRadius: '6px',
            background: '#0D0F14', border: '1px solid #181A22',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: model.color }} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', color: '#8B909A' }}>
                {model.label.split(' ')[0]}
              </span>
            </div>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: '11px',
              color: model.avgQuality === bestQuality ? '#E8A020' : '#6B7280',
            }}>
              {model.avgQuality.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
