# TokenTrace — LLM Observability Dashboard

Visualize what production LLM observability should feel like. A lightweight React dashboard that ingests mock LLM call data and surfaces the metrics that actually matter: latency distributions, cost-quality tradeoffs, error patterns, and model performance over time. No backend, no infrastructure. Just the signal, cleanly rendered.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## What It Monitors

A simulated multi-model LLM pipeline across four production models:

| Model               | Provider           | Characteristic                 |
| ------------------- | ------------------ | ------------------------------ |
| `gpt-4o`            | OpenAI             | Low latency, high quality      |
| `claude-3-5-sonnet` | Anthropic          | Best quality, competitive cost |
| `gemini-1.5-pro`    | Google             | Budget-friendly                |
| `llama-3.1-70b`     | Meta (self-hosted) | Lowest cost, highest latency   |

### Metrics Tracked

| Metric              | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `latency_ms`        | End-to-end response time in milliseconds                                   |
| `prompt_tokens`     | Tokens in the input context                                                |
| `completion_tokens` | Tokens generated in the response                                           |
| `total_cost_usd`    | Calculated from per-model pricing (input + output token rates)             |
| `status`            | `success` or `error` — reflects API-level failures                         |
| `quality_score`     | 0–1 score representing output quality (simulated via LLM-as-judge pattern) |
| `use_case`          | One of: `customer_support`, `summarization`, `code_gen`, `classification`  |

---

## Dashboard Sections

### 1. KPI Strip

Five headline metrics across all models and all time. Each card shows the 30-day aggregate value plus a 7-day trend vs. the prior 7 days. Trend color indicates whether the change is favorable or unfavorable.

### 2. Daily Call Volume Timeline

Stacked area chart showing daily API traffic across 30 days, broken out per model. Model filter toggles above the chart allow independent series visibility.

### 3. Model Performance Matrix

Side-by-side sortable comparison table. Every column is sortable by clicking the header. The best-performing cell per metric is highlighted in amber. Metrics: avg latency, avg cost/call, error rate, avg quality, total calls.

### 4. Latency Distribution

Histogram of all 500+ calls bucketed into 8 latency ranges. P50, P90, and P99 percentile reference lines overlaid with dashed markers.

### 5. Cost vs. Quality Scatter

Bubble chart placing each model at its average cost (X) vs. average quality (Y), with bubble size scaled to call volume. Top-left quadrant is optimal.

### 6. Error Rate Heatmap

7-day x 24-hour grid colored by error density. Hover any cell for exact counts. Two simulated incidents baked into the data: a peak-hour spike and an overnight blip.

### 7. Recent Calls Log

Paginated table (15/page) of recent calls. Filterable by model, use case, and status. Each row shows timestamp, model, use case tag, latency, token count, cost, quality bar, and status badge.

---

## Technical Decisions

### Data Layer (`/src/data/mockData.js`)

500+ log entries generated deterministically via a seeded LCG — consistent data story between renders. Pricing based on real API rates as of early 2026.

### Architecture

- **Component-per-section**: each panel receives only the data it needs
- **Pre-aggregated exports**: `KPI_DATA`, `MODEL_STATS`, `DAILY_VOLUME`, etc. computed at import time — components are pure render functions
- **No external state management**: `useState` used only for UI state (sort, filters, pagination)

### Design System

- **Fonts**: DM Mono for numeric/data content, Syne for headings
- **Colors**: Near-black base (`#0A0B0F`), surface cards (`#111318`), amber accent (`#E8A020`)
- **Animations**: Staggered `fadeInUp` on mount, smooth filter transitions
- **Charts**: Recharts with fully overridden dark theme styles

---

## Stack

- **React 19** + **Vite 6**
- **Tailwind CSS v4** (CSS-first config)
- **Recharts** for composable charting
- No backend. No build-time data fetching. Pure client-side.

---

Built by [jmsmrgn](https://github.com/jmsmrgn)
