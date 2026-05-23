# TradeSelect — Architecture & Flow

A React-based momentum scanner for the full NSE/BSE listed universe that finds
stocks similar to those delivering 20–30% in 15–30 days, using Smart Money
Concepts (SMC), W. D. Gann theory, and classical technical analysis.

This document is the single source of truth for project structure, data flow,
and how every step of the analysis prompt maps to concrete modules.

---

## 1. Objective (one paragraph)

Scan every NSE/BSE-listed equity (~7,000 names including SME), find the cohort
that produced a 20–30% move within any 15–30 day window in the current month,
extract the **common pattern fingerprint** across SMC + Gann + classical TA,
and use that fingerprint to rank live forward candidates. Output is a React
dashboard with a ranked watchlist, per-stock SMC/Gann overlays, and a
similarity-and-co-occurrence matrix.

---

## 2. Reality check (read before building)

| Constraint | Implication |
|---|---|
| There is **no free real-time API** for the full NSE/BSE universe. | We batch-pull EOD + delayed intraday, not live tick data. |
| NSE/BSE official endpoints are unofficial-use only and rate-limited. | Backend must throttle, retry, and cache aggressively. |
| Browser CORS blocks direct NSE calls from React. | React **never** calls NSE/BSE directly — only the FastAPI backend. |
| Full-universe TA scan = millions of indicator calls per run. | Use vectorised `pandas-ta` on the server, not per-symbol JS loops. |
| SME / micro-cap data is sparse and illiquid. | Flag with a `low_liquidity` boolean instead of excluding. |

---

## 3. Open-source foundations (the "best files" we lean on)

### 3.1 Market data (Python — backend only)

| Library | Use | Notes |
|---|---|---|
| `jugaad-data` | NSE/BSE historical OHLCV, bhavcopy, derivatives | Most reliable free NSE source; supports bulk pull. |
| `nsepy` | Older NSE historical fallback | Use as secondary if `jugaad-data` 429s. |
| `nsetools` | NSE quotes + index constituents | Source-of-truth for symbol universe. |
| `yfinance` | Cross-check + fallback for missing symbols | `.NS` / `.BO` suffix. |
| `bsedata` | BSE quotes / corporate actions | Fills BSE-only listings. |

### 3.2 Technical analysis (Python)

| Library | Use |
|---|---|
| `pandas-ta` | EMA, RSI, MACD, ADX, Stochastic, OBV, VWAP, Bollinger, ROC — vectorised. |
| `TA-Lib` (optional) | Drop-in if installed; faster ADX/Stoch. |
| `smartmoneyconcepts` (joshyattridge) | BOS, CHoCH, Order Blocks, FVG, liquidity sweeps. |
| Custom `gann.py` | Square of 9, 1×1 / 2×1 / 1×2 angles, 30/90/144/360 cycles. No mature OSS lib — built in-repo. |

### 3.3 Frontend (React)

| Library | Use |
|---|---|
| `react` 18 + `vite` | App shell, fast HMR. |
| `@tanstack/react-query` | Server-state cache, background refresh of scan results. |
| `zustand` | Local UI state (filters, selected ticker). |
| `@tanstack/react-table` | Ranked candidate table + similarity matrix. |
| `lightweight-charts` (TradingView) | OHLC chart with SMC / Gann overlays. |
| `recharts` | Sector heat-map, co-occurrence matrix, score histograms. |
| `tailwindcss` + `shadcn/ui` | Layout, components. |
| `zod` | Validate API responses. |

---

## 4. High-level architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Frontend (Vite)                       │
│  Dashboard · Candidate Table · Chart Overlay · Matrix · Filters     │
│            ▲  (REST + SSE for progress)                             │
└────────────┼────────────────────────────────────────────────────────┘
             │ HTTPS / JSON
┌────────────┴────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python 3.11)                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐     │
│  │  Ingestion   │→ │  Storage     │→ │   Analysis Pipeline    │     │
│  │  (jugaad,    │  │  (DuckDB +   │  │   step1..step12 modules│     │
│  │   yfinance)  │  │   parquet)   │  │                        │     │
│  └──────────────┘  └──────────────┘  └────────────────────────┘     │
│                                              │                      │
│                                              ▼                      │
│                                    ┌──────────────────────┐         │
│                                    │ Scoring + Ranking    │         │
│                                    │ (similarity matrix)  │         │
│                                    └──────────────────────┘         │
│                                                                     │
│  Scheduler: APScheduler — daily 18:30 IST run after market close.   │
└─────────────────────────────────────────────────────────────────────┘
```

**Why split?** TA on 7,000 symbols × 5 timeframes is tens of millions of
operations — must be vectorised in `pandas`/`numpy` server-side. React only
renders the result set.

---

## 5. Folder structure

```
TradeSelect/
├── ARCHITECTURE.md                ← this file
├── README.md
│
├── backend/                       ← Python FastAPI
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py                ← FastAPI entrypoint, routes
│   │   ├── config.py
│   │   ├── scheduler.py           ← APScheduler daily run
│   │   │
│   │   ├── ingestion/
│   │   │   ├── universe.py        ← Full NSE+BSE symbol master
│   │   │   ├── ohlcv.py           ← Bulk fetch via jugaad-data
│   │   │   ├── intraday.py        ← 15m/1h/4h aggregations
│   │   │   └── corporate.py       ← Splits/bonus adjustments
│   │   │
│   │   ├── storage/
│   │   │   ├── db.py              ← DuckDB connection
│   │   │   └── parquet_store.py   ← Per-symbol parquet files
│   │   │
│   │   ├── analysis/
│   │   │   ├── step01_qualifying.py    ← 20–30% in 15–30d filter
│   │   │   ├── step02_candles.py       ← Multi-TF candle patterns
│   │   │   ├── step03_smc.py           ← BOS/CHoCH/OB/FVG/liquidity
│   │   │   ├── step04_gann.py          ← Angles, SQ9, time cycles
│   │   │   ├── step05_trend_ma.py      ← EMA stack, BB
│   │   │   ├── step06_volume.py        ← OBV, VWAP, dry-up
│   │   │   ├── step07_momentum.py      ← RSI, MACD, ADX, Stoch
│   │   │   ├── step08_structure.py     ← Base, Cup&Handle, VCP
│   │   │   ├── step09_mtf_align.py     ← Multi-TF score /9
│   │   │   ├── step10_sector.py        ← Sector rotation, breadth
│   │   │   ├── step11_risk.py          ← SL placement, R:R
│   │   │   └── step12_scoring.py       ← Similarity + co-occurrence
│   │   │
│   │   ├── models/                ← Pydantic schemas
│   │   │   ├── candidate.py
│   │   │   ├── signal.py
│   │   │   └── scan_result.py
│   │   │
│   │   └── api/
│   │       ├── scan.py            ← GET /scan/today, /scan/latest
│   │       ├── candidate.py       ← GET /candidate/{symbol}
│   │       ├── matrix.py          ← GET /matrix/similarity
│   │       └── sectors.py         ← GET /sectors/rotation
│   │
│   └── tests/
│
└── frontend/                      ← React + Vite
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── routes.tsx             ← /, /candidate/:symbol, /matrix
        │
        ├── api/
        │   ├── client.ts          ← fetch wrapper + zod parsing
        │   ├── scan.ts            ← React Query hooks
        │   └── candidate.ts
        │
        ├── store/                 ← Zustand
        │   ├── filters.ts         ← market-cap, sector, min score
        │   └── selection.ts       ← active ticker
        │
        ├── components/
        │   ├── layout/
        │   │   ├── AppShell.tsx
        │   │   └── Sidebar.tsx
        │   │
        │   ├── candidates/
        │   │   ├── CandidateTable.tsx       ← TanStack table
        │   │   ├── ScoreBadge.tsx
        │   │   ├── ConvictionBar.tsx
        │   │   └── LiquidityWarning.tsx
        │   │
        │   ├── chart/
        │   │   ├── PriceChart.tsx           ← lightweight-charts
        │   │   ├── overlays/
        │   │   │   ├── OrderBlockOverlay.tsx
        │   │   │   ├── FVGOverlay.tsx
        │   │   │   ├── BOSMarkers.tsx
        │   │   │   ├── GannAngles.tsx
        │   │   │   ├── GannSquare9Lines.tsx
        │   │   │   └── EMAStack.tsx
        │   │   └── ChartToolbar.tsx
        │   │
        │   ├── matrix/
        │   │   ├── SimilarityMatrix.tsx     ← recharts heatmap
        │   │   └── CoOccurrenceGrid.tsx
        │   │
        │   ├── sectors/
        │   │   └── SectorHeatmap.tsx
        │   │
        │   └── checklist/
        │       └── MasterChecklist.tsx      ← the 15-point binary list
        │
        ├── pages/
        │   ├── DashboardPage.tsx
        │   ├── CandidatePage.tsx
        │   └── MatrixPage.tsx
        │
        ├── lib/
        │   ├── formatters.ts
        │   ├── scoring.ts                   ← client-side re-rank
        │   └── signalLabels.ts
        │
        └── types/
            ├── candidate.ts
            ├── signal.ts
            └── scan.ts
```

---

## 6. End-to-end data flow

```
   ┌──────────────────────────────────────────────────────────┐
   │ NIGHTLY (18:30 IST, after market close)                  │
   └──────────────────────────────────────────────────────────┘
              │
              ▼
   [1] Ingestion: universe.py loads full NSE+BSE symbol list
              │    (~7,000 tickers + exchange + sector + mcap)
              ▼
   [2] ohlcv.py pulls last 400 daily bars per symbol
       (parallelised, throttled, retried — DuckDB upsert)
              │
              ▼
   [3] intraday.py builds 4H / 1H / 15M / 5M from minute data
              │
              ▼
   [4] Analysis pipeline runs step01 → step12 in order:
        step01_qualifying  → filter cohort (20–30% in 15–30d)
        step02_candles     → record candle structure per TF
        step03_smc         → BOS, CHoCH, OB, FVG, sweeps, OTE
        step04_gann        → angles, SQ9, cycles, retracements
        step05_trend_ma    → EMA stack, BB, slope
        step06_volume      → OBV, VWAP, 2× breakout, dry-up
        step07_momentum    → RSI, MACD, ADX, Stoch, ROC
        step08_structure   → Cup, Flag, VCP, ascending triangle
        step09_mtf_align   → score /9
        step10_sector      → rotation rank, Nifty regime
        step11_risk        → SL placement, R:R
        step12_scoring     → similarity table + co-occurrence matrix
              │
              ▼
   [5] Persist results: scan_results/{YYYY-MM-DD}.parquet
              │
              ▼
   [6] FastAPI exposes:
        GET  /scan/latest      → ranked candidates + scores
        GET  /candidate/{sym}  → full signal breakdown + OHLCV
        GET  /matrix/similarity → feature-frequency table
        GET  /matrix/cooccurrence → pairwise signal matrix
        GET  /sectors/rotation → top sectors by qualifying count
        SSE  /scan/progress    → live progress during ad-hoc rescans
              │
              ▼
   ┌──────────────────────────────────────────────────────────┐
   │ React: opens Dashboard                                   │
   │  - useScanLatest() React Query hook                      │
   │  - CandidateTable renders ranked list                    │
   │  - User clicks ticker → /candidate/:symbol               │
   │  - PriceChart loads with SMC + Gann overlays             │
   │  - MasterChecklist shows 15-point pass/fail              │
   └──────────────────────────────────────────────────────────┘
```

---

## 7. How each prompt step maps to code

| Prompt step | Backend module | Output schema |
|---|---|---|
| 1 — Qualifying universe | `analysis/step01_qualifying.py` | `Candidate{ticker, exchange, entry_date, exit_date, ret_pct, sector, mcap_cat, avg_vol, low_liquidity}` |
| 2 — Candle structure across TFs | `analysis/step02_candles.py` | `CandleProfile{tf, body_pct, upper_wick, lower_wick, pattern_tags[]}` |
| 3 — SMC (BOS/OB/FVG/liquidity/OTE) | `analysis/step03_smc.py` | `SMCSignal{bos, choch, ob_zones[], fvgs[], sweeps[], premium_discount, ote_pct}` |
| 4 — Gann (angles, SQ9, cycles) | `analysis/step04_gann.py` | `GannSignal{above_1x1, sq9_cardinal_dist, time_cycle, retracement_pct, natural_number}` |
| 5 — EMA stack + BB | `analysis/step05_trend_ma.py` | `TrendSignal{ema_stack_bullish, ema20_slope, bb_expansion, pct_above_ema200}` |
| 6 — Volume forensics | `analysis/step06_volume.py` | `VolumeSignal{breakout_x_avg, obv_rising_days, vwap_reclaim, delivery_pct, dryup_days}` |
| 7 — Momentum indicators | `analysis/step07_momentum.py` | `MomentumSignal{rsi_d, rsi_w, macd_hist, adx, stoch_k, roc}` |
| 8 — Price structure | `analysis/step08_structure.py` | `StructureSignal{pattern, base_days, base_depth_pct, breakout_type}` |
| 9 — MTF alignment | `analysis/step09_mtf_align.py` | `mtf_score: 0..9` |
| 10 — Sector rotation | `analysis/step10_sector.py` | `SectorContext{sector_rank, outperforming_nifty, nifty_regime, fii_net}` |
| 11 — Risk reconstruction | `analysis/step11_risk.py` | `RiskProfile{sl_pct, rr_ratio, max_dd_during_trade}` |
| 12 — Similarity + scoring | `analysis/step12_scoring.py` | `SimilarityRow`, `CoOccurrenceCell`, final `conviction_score: 0..10` |

---

## 8. Scoring engine (deterministic, auditable)

The 15-point Master Checklist (5 SMC + 5 Gann + 5 Classical) is the canonical
binary scorer. Implementation in `step12_scoring.py`:

```python
def score_candidate(c: Candidate) -> ConvictionScore:
    smc = (
        c.smc.bos
      + c.smc.ob_mitigated
      + c.smc.fvg_filled
      + c.smc.eqh_swept_recent
      + c.smc.in_ote_zone
    )
    gann = (
        c.gann.above_1x1
      + c.gann.near_sq9_cardinal
      + c.gann.pullback_50pct
      + c.gann.time_cycle_align
      + c.gann.ma144_support
    )
    classical = (
        c.trend.ema_stack_bullish
      + (50 <= c.momentum.rsi_d <= 70 and c.momentum.rsi_rising)
      + c.momentum.macd_cross_within_5d
      + (c.volume.breakout_x_avg >= 2.0)
      + c.sector.outperforming_nifty
    )
    raw_15 = smc + gann + classical
    conviction_10 = round(raw_15 * 10 / 15, 1)
    return ConvictionScore(smc, gann, classical, raw_15, conviction_10,
                           high_priority=raw_15 >= 10)
```

The cohort-derived **similarity weights** override the default 1-per-signal
weighting once Step 12 finds which signals appeared in ≥ 60% of the qualifying
cohort — those get weight 1.5×, the rest stay at 1×. This is why the scoring
is data-driven, not hand-tuned.

---

## 9. React component tree

```
<App>
 └── <AppShell>
      ├── <Sidebar/>                                ← filters, run rescan
      └── <Routes>
           ├── "/"          → <DashboardPage>
           │                    ├── <SectorHeatmap/>
           │                    ├── <CandidateTable/>            ← rows = candidates
           │                    │     ├── <ScoreBadge/>
           │                    │     ├── <ConvictionBar/>
           │                    │     └── <LiquidityWarning/>    ← SME/micro flag
           │                    └── <MasterChecklist summary/>
           │
           ├── "/candidate/:symbol" → <CandidatePage>
           │                    ├── <PriceChart>
           │                    │     ├── <OrderBlockOverlay/>
           │                    │     ├── <FVGOverlay/>
           │                    │     ├── <BOSMarkers/>
           │                    │     ├── <GannAngles/>
           │                    │     ├── <GannSquare9Lines/>
           │                    │     └── <EMAStack/>
           │                    ├── <MasterChecklist/>           ← 15 binary rows
           │                    ├── <SignalBreakdown/>           ← SMC/Gann/Classical tabs
           │                    └── <RiskReward/>
           │
           └── "/matrix"    → <MatrixPage>
                                ├── <SimilarityMatrix/>          ← Step-12 frequency table
                                └── <CoOccurrenceGrid/>          ← pairwise %
```

---

## 10. State management

| State | Lives in | Why |
|---|---|---|
| Latest scan result | React Query cache | Server-owned, refreshed on mount + on demand. |
| Candidate detail | React Query (`['candidate', symbol]`) | Lazy loaded per click. |
| Active filters (sector, mcap, min score) | Zustand `filtersStore` | UI-only, persists in localStorage. |
| Selected ticker / chart timeframe | Zustand `selectionStore` | UI-only. |
| Chart overlay toggles (OB on/off, Gann on/off) | URL search params | Shareable links. |

---

## 11. API contract (the only thing React knows about)

```ts
// GET /scan/latest
type ScanLatest = {
  scan_date: string;                 // ISO
  cohort_size: number;
  feature_frequencies: Record<SignalKey, number>;  // 0..1 — drives Step-12 table
  candidates: Candidate[];
};

type Candidate = {
  symbol: string;
  exchange: 'NSE' | 'BSE' | 'BOTH';
  name: string;
  sector: string;
  mcap_category: 'LARGE'|'MID'|'SMALL'|'MICRO'|'SME';
  low_liquidity: boolean;

  scores: {
    smc: number;        // 0..5
    gann: number;       // 0..5
    classical: number;  // 0..5
    raw_15: number;
    conviction_10: number;
    high_priority: boolean;
  };

  setup: {
    entry_zone: [number, number];
    stop_loss: number;
    target_low: number;
    target_high: number;
    rr_ratio: number;
  };

  signals: {
    smc:       SMCSignal;
    gann:      GannSignal;
    trend:     TrendSignal;
    volume:    VolumeSignal;
    momentum:  MomentumSignal;
    structure: StructureSignal;
    mtf_score: number;            // 0..9
    sector:    SectorContext;
  };
};
```

`zod` schemas in `frontend/src/api/*.ts` mirror these exactly so a backend
contract drift fails loudly at the boundary.

---

## 12. Caching, scheduling, performance

| Concern | Approach |
|---|---|
| Symbol universe | Refresh weekly; pinned to last-known-good if NSE returns errors. |
| Daily OHLCV | Pulled once per evening; incremental — only last 2 trading days re-fetched. |
| Per-symbol parquet | Append-only; full file rewritten only on corporate-action adjustment. |
| TA computation | Single vectorised `pandas-ta` pass per symbol → ~3–5 ms each. ~30s for 7k symbols on 8 cores via `concurrent.futures`. |
| SMC / Gann | Heavier (~30 ms per symbol) — parallelised, ~5 min full run. |
| Frontend cache | React Query `staleTime: 1 hour`, `gcTime: 24 hours`. |
| Backpressure | If ingestion fails > 30% of symbols, the run is **aborted** and the previous day's scan stays live (no half-baked results in the UI). |

---

## 13. Build & run

```bash
# Backend
cd backend
uv venv && source .venv/bin/activate    # or python -m venv
uv pip install -e .
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
pnpm install
pnpm dev                                 # http://localhost:5173 → proxies /api → :8000
```

Vite proxy in `vite.config.ts` forwards `/api/*` to `http://localhost:8000` so
there is no CORS dance in dev.

---

## 14. Roadmap (build in this order)

1. **Phase 0 — Skeleton:** repo, FastAPI hello, Vite hello, one end-to-end fetch.
2. **Phase 1 — Ingestion:** universe + daily OHLCV for Nifty 500 only.
3. **Phase 2 — Classical TA + Step 1 filter:** prove the 20–30%/15–30d filter
   produces a sane cohort. Render `CandidateTable` with classical-only scores.
4. **Phase 3 — SMC module:** add `step03_smc.py`, render OB + FVG overlays.
5. **Phase 4 — Gann module:** add `step04_gann.py`, render angles + SQ9 lines.
6. **Phase 5 — Full universe:** extend ingestion to BSE + SME, throttling.
7. **Phase 6 — Similarity & co-occurrence:** Step 12 table + matrix page.
8. **Phase 7 — Scheduler:** APScheduler 18:30 IST run; SSE progress.
9. **Phase 8 — Backtest harness:** replay prior months, validate that the
   ≥10/15 filter would have caught past 20–30% movers. **This is the only
   validation that matters** — every other metric is decoration.

---

## 15. Known limitations (be honest with the user)

- **No live tick data.** Intraday refresh is 15-min delayed at best.
- **SME / micro-cap signals are noisy.** Liquidity filter flags but doesn't
  exclude — final decision is the user's.
- **Gann time cycles are heuristic.** The 30 / 90 / 144 / 360 cycles are coded
  from primary sources but Gann's own work is interpretive; expect false
  positives at cycle boundaries.
- **Survivorship bias** in Step 1: the cohort is by definition winners.
  Phase-8 backtest must include the *losers that looked identical at entry*
  to compute true hit rate, not just feature frequency among winners.
- **No order routing.** This is a research tool, not a broker integration.

---

*Architecture file — single source of truth. Update this file whenever a
module is added, renamed, or the API contract changes.*
