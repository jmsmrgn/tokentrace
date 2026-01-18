import { useState, useMemo } from 'react'
import { MODEL_META, USE_CASE_LABELS } from '../data/mockData'

const PAGE_SIZE = 15
const ALL = 'all'

const QUALITY_COLORS = [
  { min: 0.90, color: '#4ADE80' },
  { min: 0.75, color: '#A3E635' },
  { min: 0.60, color: '#FACC15' },
  { min: 0.40, color: '#FB923C' },
  { min: 0.00, color: '#F87171' },
]
function qualityColor(q, status) {
  if (status === 'error') return '#F87171'
  return QUALITY_COLORS.find(c => q >= c.min)?.color ?? '#F87171'
}

function QualityBar({ score, status }) {
  const pct   = Math.round((status === 'error' ? score * 0.3 : score) * 100)
  const color = qualityColor(score, status)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <div style={{
        width: '52px', height: '4px', borderRadius: '2px', background: '#1E2028',
        overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color }}>{score.toFixed(3)}</span>
    </div>
  )
}

function formatTs(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

const USE_CASE_COLORS = {
  customer_support: '#3B82F6',
  summarization:    '#A78BFA',
  code_gen:         '#34D399',
  classification:   '#F59E0B',
}

export default function LogsTable({ logs, loaded }) {
  const [modelFilter,   setModelFilter]   = useState(ALL)
  const [ucFilter,      setUcFilter]      = useState(ALL)
  const [statusFilter,  setStatusFilter]  = useState(ALL)
  const [page,          setPage]          = useState(1)

  const models    = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'llama-3.1-70b']
  const useCases  = ['customer_support', 'summarization', 'code_gen', 'classification']

  const filtered = useMemo(() => {
    const recent = [...logs].reverse().slice(0, 500) // last 500
    return recent.filter(e =>
      (modelFilter  === ALL || e.model    === modelFilter) &&
      (ucFilter     === ALL || e.use_case === ucFilter) &&
      (statusFilter === ALL || e.status   === statusFilter)
    )
  }, [logs, modelFilter, ucFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageData    = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function setFilter(type, val) {
    if (type === 'model')  { setModelFilter(val);  setPage(1) }
    if (type === 'uc')     { setUcFilter(val);     setPage(1) }
    if (type === 'status') { setStatusFilter(val); setPage(1) }
  }

  // Pagination page numbers
  function pageNumbers() {
    const pages = []
    const delta = 2
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div
      className={`card anim-fade-up delay-8`}
      style={{ opacity: loaded ? undefined : 0 }}
    >
      {/* Header */}
      <div style={{
        padding: '18px 20px 14px', borderBottom: '1px solid #1A1C23',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div className="section-label">Event Stream</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#F1F2F4', marginTop: '4px' }}>
            Recent Calls
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#3D4149', marginLeft: '10px', fontWeight: 400 }}>
              {filtered.length.toLocaleString()} matching
            </span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Model filter */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className={`filter-btn ${modelFilter === ALL ? 'active' : ''}`}
              style={{ '--model-color': '#E8A020', '--model-bg': 'rgba(232,160,32,0.1)' }}
              onClick={() => setFilter('model', ALL)}>All</button>
            {models.map(m => (
              <button
                key={m}
                className={`filter-btn ${modelFilter === m ? 'active' : ''}`}
                style={{ '--model-color': MODEL_META[m].color, '--model-bg': MODEL_META[m].bg }}
                onClick={() => setFilter('model', m)}
              >
                {MODEL_META[m].label.split(' ')[0]}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: '#1E2028' }} />

          {/* Use case filter */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className={`filter-btn ${ucFilter === ALL ? 'active' : ''}`}
              style={{ '--model-color': '#E8A020', '--model-bg': 'rgba(232,160,32,0.1)' }}
              onClick={() => setFilter('uc', ALL)}>All</button>
            {useCases.map(uc => (
              <button
                key={uc}
                className={`filter-btn ${ucFilter === uc ? 'active' : ''}`}
                style={{ '--model-color': USE_CASE_COLORS[uc], '--model-bg': `${USE_CASE_COLORS[uc]}1A` }}
                onClick={() => setFilter('uc', uc)}
              >
                {USE_CASE_LABELS[uc].split(' ')[0]}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: '#1E2028' }} />

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { val: ALL,       label: 'All',     cls: 'active', style: { '--model-color': '#E8A020', '--model-bg': 'rgba(232,160,32,0.1)' } },
              { val: 'success', label: '✓ OK',    cls: '',       style: { '--model-color': '#4ADE80', '--model-bg': 'rgba(74,222,128,0.08)' } },
              { val: 'error',   label: '✗ Error', cls: '',       style: { '--model-color': '#F87171', '--model-bg': 'rgba(248,113,113,0.08)' } },
            ].map(({ val, label, style }) => (
              <button
                key={val}
                className={`filter-btn ${statusFilter === val ? 'active' : ''}`}
                style={style}
                onClick={() => setFilter('status', val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left',  paddingLeft: '20px' }}>#</th>
              <th style={{ textAlign: 'left'  }}>Timestamp</th>
              <th style={{ textAlign: 'left'  }}>Model</th>
              <th style={{ textAlign: 'left'  }}>Use Case</th>
              <th style={{ textAlign: 'right' }}>Latency</th>
              <th style={{ textAlign: 'right' }}>Tokens</th>
              <th style={{ textAlign: 'right' }}>Cost</th>
              <th style={{ textAlign: 'left'  }}>Quality</th>
              <th style={{ textAlign: 'center'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#3D4149', padding: '32px', fontFamily: "'Syne', sans-serif" }}>
                  No entries match current filters
                </td>
              </tr>
            ) : pageData.map((entry, i) => {
              const meta   = MODEL_META[entry.model]
              const ucColor = USE_CASE_COLORS[entry.use_case] ?? '#6B7280'
              const rowIdx  = (currentPage - 1) * PAGE_SIZE + i + 1
              return (
                <tr key={entry.id}>
                  <td style={{ paddingLeft: '20px', color: '#2E3140', fontSize: '11px' }}>{rowIdx}</td>
                  <td style={{ color: '#4B5263', whiteSpace: 'nowrap' }}>{formatTs(entry.timestamp)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: meta.color, flexShrink: 0 }} />
                      <span style={{ color: meta.color }}>{meta.label}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: '11px',
                      padding: '2px 8px', borderRadius: '4px',
                      background: `${ucColor}14`, color: ucColor,
                      border: `1px solid ${ucColor}28`,
                    }}>
                      {USE_CASE_LABELS[entry.use_case]}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: entry.latency_ms > 3000 ? '#F87171' : '#C8CAD0' }}>
                    {entry.latency_ms.toLocaleString()} ms
                  </td>
                  <td style={{ textAlign: 'right', color: '#6B7280' }}>
                    {entry.total_tokens.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', color: '#E8A020' }}>
                    ${entry.total_cost_usd.toFixed(4)}
                  </td>
                  <td>
                    <QualityBar score={entry.quality_score} status={entry.status} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge badge-${entry.status}`}>
                      {entry.status === 'success' ? '✓ OK' : '✗ Error'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid #1A1C23',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#3D4149' }}>
          Page {currentPage} of {totalPages} · {filtered.length} results
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button className="page-btn" disabled={currentPage === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {pageNumbers().map(p => (
            <button
              key={p}
              className={`page-btn ${p === currentPage ? 'current' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  )
}
