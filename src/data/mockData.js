// ─── TokenTrace Mock Data ────────────────────────────────────────────────────
// Deterministic LCG for reproducible "random" data
let _seed = 31337;
function rng() {
  _seed = Math.imul(_seed ^ (_seed >>> 13), 1540483477);
  _seed ^= _seed >>> 15;
  return (_seed >>> 0) / 4294967296;
}
function ri(min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function rf(min, max) { return min + rng() * (max - min); }
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

// ─── Constants ───────────────────────────────────────────────────────────────
export const MODELS = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'llama-3.1-70b'];
export const USE_CASES = ['customer_support', 'summarization', 'code_gen', 'classification'];

export const MODEL_META = {
  'gpt-4o':           { label: 'GPT-4o',            color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  'claude-3-5-sonnet':{ label: 'Claude 3.5 Sonnet',  color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  'gemini-1.5-pro':   { label: 'Gemini 1.5 Pro',     color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  'llama-3.1-70b':    { label: 'Llama 3.1 70B',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

export const USE_CASE_LABELS = {
  customer_support: 'Customer Support',
  summarization:    'Summarization',
  code_gen:         'Code Generation',
  classification:   'Classification',
};

// Model behavioral profiles
const PROFILE = {
  'gpt-4o':           { latMin:  620, latMax: 2400, cIn: 0.00500, cOut: 0.01500, qMin: 0.80, qMax: 0.97, errBase: 0.028, weight: 30 },
  'claude-3-5-sonnet':{ latMin:  850, latMax: 2900, cIn: 0.00300, cOut: 0.01500, qMin: 0.83, qMax: 0.98, errBase: 0.022, weight: 35 },
  'gemini-1.5-pro':   { latMin: 1100, latMax: 3400, cIn: 0.00125, cOut: 0.00500, qMin: 0.74, qMax: 0.91, errBase: 0.051, weight: 20 },
  'llama-3.1-70b':    { latMin: 1300, latMax: 4900, cIn: 0.00090, cOut: 0.00090, qMin: 0.69, qMax: 0.87, errBase: 0.072, weight: 15 },
};

// ─── Log Generation ──────────────────────────────────────────────────────────
const BASE_TS = new Date('2026-02-21T23:59:59Z').getTime();
const DAY_MS  = 86400000;

function generateLogs() {
  const entries = [];

  for (let dayOff = 29; dayOff >= 0; dayOff--) {
    const dayMs  = BASE_TS - dayOff * DAY_MS;
    const dow    = new Date(dayMs).getUTCDay();         // 0=Sun
    const isWeekend = dow === 0 || dow === 6;
    const isMonday  = dow === 1;

    let count = isWeekend ? ri(7, 13) : ri(15, 23);
    if (isMonday) count += ri(3, 7);                   // Monday spike
    if (!isWeekend && rng() < 0.12) count += ri(6, 14); // random traffic spike

    for (let i = 0; i < count; i++) {
      // Business-hour-weighted time distribution
      let hour;
      const r = rng();
      if      (r < 0.03) hour = ri(0, 5);
      else if (r < 0.10) hour = ri(6, 8);
      else if (r < 0.45) hour = ri(9, 12);
      else if (r < 0.73) hour = ri(13, 17);
      else if (r < 0.88) hour = ri(18, 20);
      else               hour = ri(21, 23);

      const min = ri(0, 59), sec = ri(0, 59);
      const ts  = new Date(dayMs + (hour * 3600 + min * 60 + sec) * 1000);

      const model = pickWeighted(MODELS, MODELS.map(m => PROFILE[m].weight));
      const p     = PROFILE[model];

      const promptTokens     = ri(80, 2100);
      const completionTokens = ri(40, 850);
      const latency_ms       = ri(p.latMin, p.latMax);
      const cost             = (promptTokens / 1000) * p.cIn + (completionTokens / 1000) * p.cOut;

      // Error spikes: peak morning hours + random "incident" windows
      const peakMul = (hour >= 9 && hour <= 11) ? 1.5 : 1.0;
      const incidentMul = (dayOff === 7 && hour >= 14 && hour <= 16) ? 4.0  // simulated incident
                        : (dayOff === 18 && hour >= 2  && hour <= 4)  ? 3.0  // overnight blip
                        : 1.0;
      const status = rng() < p.errBase * peakMul * incidentMul ? 'error' : 'success';

      const use_case     = pick(USE_CASES);
      const quality_score = status === 'error'
        ? parseFloat(rf(0, 0.20).toFixed(3))
        : parseFloat(rf(p.qMin, p.qMax).toFixed(3));

      entries.push({
        id:               entries.length + 1,
        timestamp:        ts.toISOString(),
        model,
        latency_ms,
        prompt_tokens:    promptTokens,
        completion_tokens: completionTokens,
        total_tokens:     promptTokens + completionTokens,
        total_cost_usd:   parseFloat(cost.toFixed(6)),
        status,
        use_case,
        quality_score,
      });
    }
  }

  return entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export const LOG_ENTRIES = generateLogs();

// ─── KPI Computations ────────────────────────────────────────────────────────
function computeKPIs(entries) {
  const now    = BASE_TS;
  const cut7   = now - 7  * DAY_MS;
  const cut14  = now - 14 * DAY_MS;

  const recent = entries.filter(e => new Date(e.timestamp).getTime() >= cut7);
  const prev   = entries.filter(e => { const t = new Date(e.timestamp).getTime(); return t >= cut14 && t < cut7; });

  function agg(arr) {
    if (!arr.length) return { totalCalls:0, avgLatency:0, totalCost:0, errorRate:0, avgQuality:0 };
    const errors = arr.filter(e => e.status === 'error');
    const successes = arr.filter(e => e.status === 'success');
    return {
      totalCalls: arr.length,
      avgLatency: arr.reduce((s, e) => s + e.latency_ms, 0) / arr.length,
      totalCost:  arr.reduce((s, e) => s + e.total_cost_usd, 0),
      errorRate:  errors.length / arr.length,
      avgQuality: successes.length ? successes.reduce((s, e) => s + e.quality_score, 0) / successes.length : 0,
    };
  }

  const all = agg(entries);
  const r   = agg(recent);
  const pr  = agg(prev);

  function trend(curr, prev, lowerIsBetter = false) {
    if (!prev) return { delta: 0, isPositive: true };
    const delta = prev === 0 ? 0 : (curr - prev) / prev;
    const isPositive = lowerIsBetter ? delta <= 0 : delta >= 0;
    return { delta, isPositive };
  }

  return {
    totalCalls: { value: all.totalCalls, recent: r.totalCalls, ...trend(r.totalCalls, pr.totalCalls) },
    avgLatency: { value: all.avgLatency, recent: r.avgLatency, ...trend(r.avgLatency, pr.avgLatency, true) },
    totalCost:  { value: all.totalCost,  recent: r.totalCost,  ...trend(r.totalCost,  pr.totalCost) },
    errorRate:  { value: all.errorRate,  recent: r.errorRate,  ...trend(r.errorRate,  pr.errorRate, true) },
    avgQuality: { value: all.avgQuality, recent: r.avgQuality, ...trend(r.avgQuality, pr.avgQuality) },
  };
}

export const KPI_DATA = computeKPIs(LOG_ENTRIES);

// ─── Model Stats ─────────────────────────────────────────────────────────────
function computeModelStats(entries) {
  return MODELS.map(model => {
    const me  = entries.filter(e => e.model === model);
    const err = me.filter(e => e.status === 'error');
    const suc = me.filter(e => e.status === 'success');
    return {
      model,
      label:       MODEL_META[model].label,
      color:       MODEL_META[model].color,
      totalCalls:  me.length,
      avgLatency:  me.length ? me.reduce((s,e) => s + e.latency_ms, 0) / me.length : 0,
      avgCost:     me.length ? me.reduce((s,e) => s + e.total_cost_usd, 0) / me.length : 0,
      totalCost:   me.reduce((s,e) => s + e.total_cost_usd, 0),
      errorRate:   me.length ? err.length / me.length : 0,
      avgQuality:  suc.length ? suc.reduce((s,e) => s + e.quality_score, 0) / suc.length : 0,
    };
  });
}

export const MODEL_STATS = computeModelStats(LOG_ENTRIES);

// ─── Daily Volume ─────────────────────────────────────────────────────────────
function computeDailyVolume(entries) {
  const days = {};
  entries.forEach(e => {
    const d = e.timestamp.slice(0, 10);
    if (!days[d]) days[d] = { date: d, 'gpt-4o': 0, 'claude-3-5-sonnet': 0, 'gemini-1.5-pro': 0, 'llama-3.1-70b': 0, total: 0 };
    days[d][e.model]++;
    days[d].total++;
  });
  return Object.values(days).sort((a,b) => a.date.localeCompare(b.date));
}

export const DAILY_VOLUME = computeDailyVolume(LOG_ENTRIES);

// ─── Latency Histogram ────────────────────────────────────────────────────────
const BUCKETS = [
  { label: '0–500',   min: 0,    max: 500  },
  { label: '500–1k',  min: 500,  max: 1000 },
  { label: '1–1.5k',  min: 1000, max: 1500 },
  { label: '1.5–2k',  min: 1500, max: 2000 },
  { label: '2–2.5k',  min: 2000, max: 2500 },
  { label: '2.5–3k',  min: 2500, max: 3000 },
  { label: '3–4k',    min: 3000, max: 4000 },
  { label: '4k+',     min: 4000, max: Infinity },
];

function computeLatencyHistogram(entries) {
  const counts = BUCKETS.map(b => ({ ...b, count: 0 }));
  entries.forEach(e => {
    const b = counts.find(x => e.latency_ms >= x.min && e.latency_ms < x.max);
    if (b) b.count++;
  });
  return counts;
}

export const LATENCY_HISTOGRAM = computeLatencyHistogram(LOG_ENTRIES);

function computePercentiles(entries) {
  const sorted = [...entries].map(e => e.latency_ms).sort((a,b) => a - b);
  const p = pct => sorted[Math.floor(pct * sorted.length)];
  return { p50: p(0.50), p90: p(0.90), p99: p(0.99) };
}

export const PERCENTILES = computePercentiles(LOG_ENTRIES);

// Which histogram bucket does each percentile fall into?
export function getBucketForLatency(ms) {
  const idx = BUCKETS.findIndex(b => ms >= b.min && ms < b.max);
  return idx === -1 ? BUCKETS.length - 1 : idx;
}

// ─── Cost vs Quality Scatter ──────────────────────────────────────────────────
function computeCostQuality(entries) {
  return MODELS.map(model => {
    const me  = entries.filter(e => e.model === model);
    const suc = me.filter(e => e.status === 'success');
    return {
      model,
      label:      MODEL_META[model].label,
      color:      MODEL_META[model].color,
      avgCost:    me.length  ? me.reduce((s,e) => s + e.total_cost_usd, 0) / me.length  : 0,
      avgQuality: suc.length ? suc.reduce((s,e) => s + e.quality_score, 0) / suc.length : 0,
      totalCalls: me.length,
    };
  });
}

export const COST_QUALITY_DATA = computeCostQuality(LOG_ENTRIES);

// ─── Error Rate Heatmap (7 days × 24 hours) ──────────────────────────────────
function computeErrorHeatmap(entries) {
  const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const grid = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ errors: 0, total: 0 }))
  );

  const cutoff = BASE_TS - 7 * DAY_MS;

  entries
    .filter(e => new Date(e.timestamp).getTime() >= cutoff)
    .forEach(e => {
      const ts   = new Date(e.timestamp);
      const diff = Math.floor((BASE_TS - ts.getTime()) / DAY_MS);
      const di   = 6 - Math.min(diff, 6);       // 0 = oldest shown, 6 = today
      const hr   = ts.getUTCHours();
      if (di >= 0 && di < 7) {
        grid[di][hr].total++;
        if (e.status === 'error') grid[di][hr].errors++;
      }
    });

  return Array.from({ length: 7 }, (_, di) => {
    const dateMs = BASE_TS - (6 - di) * DAY_MS;
    const dow    = new Date(dateMs).getUTCDay();
    return {
      dayLabel: DAY_LABELS[dow],
      date:     new Date(dateMs).toISOString().slice(0, 10),
      hours:    grid[di].map((cell, h) => ({
        hour:   h,
        errors: cell.errors,
        total:  cell.total,
        rate:   cell.total > 0 ? cell.errors / cell.total : 0,
      })),
    };
  });
}

export const ERROR_HEATMAP = computeErrorHeatmap(LOG_ENTRIES);
