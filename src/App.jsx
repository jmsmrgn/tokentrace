import { useEffect, useState } from 'react'
import KPIStrip            from './components/KPIStrip'
import ModelMatrix         from './components/ModelMatrix'
import TimelineChart       from './components/TimelineChart'
import LatencyChart        from './components/LatencyChart'
import CostScatter         from './components/CostScatter'
import ErrorHeatmap        from './components/ErrorHeatmap'
import LogsTable           from './components/LogsTable'
import {
  KPI_DATA, MODEL_STATS, DAILY_VOLUME,
  LATENCY_HISTOGRAM, PERCENTILES,
  COST_QUALITY_DATA, ERROR_HEATMAP, LOG_ENTRIES,
} from './data/mockData'

const NAV_ITEMS = [
  { id: 'kpis',     label: 'Overview'    },
  { id: 'models',   label: 'Models'      },
  { id: 'timeline', label: 'Timeline'    },
  { id: 'latency',  label: 'Latency'     },
  { id: 'scatter',  label: 'Cost/Quality'},
  { id: 'heatmap',  label: 'Errors'      },
  { id: 'logs',     label: 'Logs'        },
]

const S = {
  shell: {
    display: 'flex', minHeight: '100vh',
    background: '#0A0B0F',
  },
  sidebar: {
    width: '200px', flexShrink: 0,
    background: '#0C0D12',
    borderRight: '1px solid #181920',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh',
    overflowY: 'auto',
    padding: '0 0 24px',
  },
  logoBox: {
    padding: '22px 20px 18px',
    borderBottom: '1px solid #181920',
    marginBottom: '8px',
  },
  logoText: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px',
    color: '#F1F2F4', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px',
  },
  logoAccent: { color: '#E8A020' },
  logoSub: {
    fontFamily: "'DM Mono', monospace", fontSize: '10px',
    color: '#3D4149', marginTop: '3px', letterSpacing: '0.06em',
  },
  navSection: { padding: '6px 12px 4px', marginBottom: '2px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '7px 12px', borderRadius: '6px', cursor: 'pointer',
    fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 500,
    color: '#4B5263', transition: 'all 0.15s', border: 'none',
    background: 'transparent', width: '100%', textAlign: 'left',
  },
  navItemActive: { color: '#F1F2F4', background: '#181A22' },
  navDot: { width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', opacity: 0.6 },
  main: {
    flex: 1, minWidth: 0,
    padding: '24px 28px',
    maxWidth: '1480px',
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '28px', paddingBottom: '18px',
    borderBottom: '1px solid #181920',
  },
  topTitle: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px',
    color: '#F1F2F4', letterSpacing: '-0.02em',
  },
  topMeta: {
    display: 'flex', alignItems: 'center', gap: '18px',
  },
  metaChip: {
    fontFamily: "'DM Mono', monospace", fontSize: '11px',
    color: '#4B5263', background: '#111318',
    border: '1px solid #1E2028', borderRadius: '6px',
    padding: '5px 10px',
  },
  row: { display: 'grid', gap: '16px', marginBottom: '16px' },
  row2: { gridTemplateColumns: '1fr 1fr' },
  rowTimeline: { gridTemplateColumns: '1fr 420px' },
}

export default function App() {
  const [active, setActive] = useState('kpis')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  function scrollTo(id) {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Track scroll to update active nav
  useEffect(() => {
    function onScroll() {
      for (const item of [...NAV_ITEMS].reverse()) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(item.id); break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const totalEntries = LOG_ENTRIES.length

  return (
    <div style={S.shell}>
      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.logoBox}>
          <div style={S.logoText}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="0" y="0" width="8" height="8" rx="2" fill="#E8A020"/>
              <rect x="10" y="0" width="8" height="8" rx="2" fill="#3B82F6" opacity="0.7"/>
              <rect x="0" y="10" width="8" height="8" rx="2" fill="#A78BFA" opacity="0.6"/>
              <rect x="10" y="10" width="8" height="8" rx="2" fill="#34D399" opacity="0.6"/>
            </svg>
            Token<span style={S.logoAccent}>Trace</span>
          </div>
          <div style={S.logoSub}>LLM Observability</div>
        </div>

        <div style={S.navSection}>
          <div className="section-label" style={{ padding: '4px 0', marginBottom: '6px' }}>Navigation</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              style={{ ...S.navItem, ...(active === item.id ? S.navItemActive : {}) }}
              onClick={() => scrollTo(item.id)}
            >
              <span style={S.navDot} />
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '12px 20px', borderTop: '1px solid #181920' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#2E3140', lineHeight: 1.6 }}>
            <div>{totalEntries.toLocaleString()} total events</div>
            <div>Last 30 days</div>
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div className="live-dot" />
              <span style={{ color: '#3D4149' }}>Live · Feb 2026</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>
        {/* Top bar */}
        <div style={S.topBar}>
          <div>
            <div style={S.topTitle}>Pipeline Dashboard</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#3D4149', marginTop: '3px' }}>
              Jan 23 – Feb 21, 2026 · 4 models · {totalEntries.toLocaleString()} calls
            </div>
          </div>
          <div style={S.topMeta}>
            <div style={S.metaChip}>gpt-4o · claude-3-5-sonnet · gemini-1.5-pro · llama-3.1-70b</div>
            <div style={{ ...S.metaChip, borderColor: 'rgba(34,197,94,0.2)', color: '#22C55E', background: 'rgba(34,197,94,0.05)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="live-dot" /> Live
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <section id="kpis" style={{ scrollMarginTop: '80px', marginBottom: '16px' }}>
          <KPIStrip data={KPI_DATA} loaded={loaded} />
        </section>

        {/* Timeline + Model Matrix */}
        <section id="timeline" style={{ scrollMarginTop: '80px', ...S.row, ...S.rowTimeline, marginBottom: '16px' }}>
          <TimelineChart data={DAILY_VOLUME} loaded={loaded} />
          <div id="models" style={{ scrollMarginTop: '80px' }}>
            <ModelMatrix data={MODEL_STATS} loaded={loaded} />
          </div>
        </section>

        {/* Latency + Scatter */}
        <section id="latency" style={{ scrollMarginTop: '80px', ...S.row, ...S.row2, marginBottom: '16px' }}>
          <LatencyChart data={LATENCY_HISTOGRAM} percentiles={PERCENTILES} loaded={loaded} />
          <div id="scatter" style={{ scrollMarginTop: '80px' }}>
            <CostScatter data={COST_QUALITY_DATA} loaded={loaded} />
          </div>
        </section>

        {/* Error Heatmap */}
        <section id="heatmap" style={{ scrollMarginTop: '80px', marginBottom: '16px' }}>
          <ErrorHeatmap data={ERROR_HEATMAP} loaded={loaded} />
        </section>

        {/* Logs Table */}
        <section id="logs" style={{ scrollMarginTop: '80px', marginBottom: '16px' }}>
          <LogsTable logs={LOG_ENTRIES} loaded={loaded} />
        </section>

        <footer style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#2A2D38', textAlign: 'center', padding: '16px 0 8px' }}>
          TokenTrace · LLM Observability Dashboard · Portfolio Project
        </footer>
      </main>
    </div>
  )
}
