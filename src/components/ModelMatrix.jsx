import { useState } from 'react'

const COLS = [
  { key: 'label',      label: 'Model',       align: 'left',  fmt: v => v,                          winner: false },
  { key: 'totalCalls', label: 'Calls',        align: 'right', fmt: v => v.toLocaleString(),          winner: 'max' },
  { key: 'avgLatency', label: 'Latency',      align: 'right', fmt: v => `${Math.round(v)} ms`,       winner: 'min' },
  { key: 'avgCost',    label: 'Cost / Call',  align: 'right', fmt: v => `$${v.toFixed(4)}`,          winner: 'min' },
  { key: 'errorRate',  label: 'Error Rate',   align: 'right', fmt: v => `${(v*100).toFixed(2)}%`,    winner: 'min' },
  { key: 'avgQuality', label: 'Quality',      align: 'right', fmt: v => v.toFixed(3),                winner: 'max' },
]

function computeWinners(data) {
  const winners = {}
  COLS.forEach(col => {
    if (!col.winner) return
    const values = data.map(r => r[col.key])
    winners[col.key] = col.winner === 'max'
      ? Math.max(...values)
      : Math.min(...values)
  })
  return winners
}

export default function ModelMatrix({ data, loaded }) {
  const [sortKey,  setSortKey]  = useState('totalCalls')
  const [sortDir,  setSortDir]  = useState('desc')

  if (!data) return null

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const winners = computeWinners(data)

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div
      className={`card anim-fade-up delay-3`}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', opacity: loaded ? undefined : 0 }}
    >
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #1A1C23' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="section-label">Model Performance</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#F1F2F4', marginTop: '4px' }}>
              Matrix Comparison
            </div>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#2E3140', textAlign: 'right', lineHeight: 1.6 }}>
            <div>Click headers to sort</div>
            <div style={{ color: '#E8A020' }}>★ = best in class</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table>
          <thead>
            <tr>
              {COLS.map(col => (
                <th
                  key={col.key}
                  className={sortKey === col.key ? 'th-active' : ''}
                  style={{ textAlign: col.align }}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: '4px', fontSize: '9px' }}>
                      {sortDir === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => (
              <tr key={row.model}>
                {COLS.map(col => {
                  const val      = row[col.key]
                  const isWinner = col.winner && winners[col.key] === val
                  return (
                    <td
                      key={col.key}
                      className={isWinner && col.key !== 'label' ? 'td-winner' : ''}
                      style={{ textAlign: col.align }}
                    >
                      {col.key === 'label' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px', height: '8px', borderRadius: '2px',
                            background: row.color, flexShrink: 0,
                          }} />
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#C8CAD0' }}>
                            {val}
                          </span>
                        </div>
                      ) : (
                        <span>
                          {col.fmt(val)}
                          {isWinner && <span style={{ marginLeft: '6px', color: '#E8A020', fontSize: '10px' }}>★</span>}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div style={{ padding: '10px 20px', borderTop: '1px solid #1A1C23' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#2A2D38' }}>
          ★ Highlighted cells indicate best value per metric across all models
        </div>
      </div>
    </div>
  )
}
