# TradeSelect

NSE/BSE full-universe momentum scanner that finds stocks similar to those
delivering 20–30% in 15–30 days, using **Smart Money Concepts (SMC)**,
**W. D. Gann theory**, and **classical TA** as three independent scoring pillars
fused into a single 0–10 conviction score.

> See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full design, data flow, module map, and roadmap.

---

## Stack

- **Backend** — FastAPI + Pydantic v2 (Python 3.11+)
- **Frontend** — React 18 + Vite + TypeScript + Tailwind + TanStack Query/Table + Zustand + Zod
- **Data (Phase 1+)** — `jugaad-data`, `yfinance`, `bsedata`, stored in DuckDB + parquet
- **TA (Phase 2+)** — `pandas-ta`, `smartmoneyconcepts` (joshyattridge), custom `gann.py`

---

## Phase 0 — what's running today

A working end-to-end skeleton:

- Backend serves **mock** `GET /api/scan/latest` and `GET /api/scan/candidate/{symbol}`
  in the exact shape the real pipeline will produce.
- Frontend Dashboard renders a ranked candidate table with conviction bars,
  SMC / Gann / Classical sub-scores, entry/SL/target, and a low-liquidity flag.
- `/candidate/:symbol` opens the 15-point Master Checklist + setup + indicators.
- `/matrix` shows the Step-12 feature-frequency and co-occurrence tables.

Phases 1–8 (in [ARCHITECTURE.md §14](./ARCHITECTURE.md#14-roadmap-build-in-this-order))
swap the mock for real ingestion + TA. The frontend doesn't change.

---

## Run it

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Smoke test:

```powershell
curl http://localhost:8000/api/health
curl http://localhost:8000/api/scan/latest
```

### Frontend

```powershell
cd frontend
pnpm install        # or: npm install
pnpm dev            # http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:8000`, so the browser never hits CORS.

---

## Project layout

```
TradeSelect/
├── ARCHITECTURE.md          ← single source of truth for design & flow
├── README.md                ← you are here
├── .gitignore
├── backend/                 ← FastAPI service
│   ├── pyproject.toml
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── api/scan.py
│       ├── models/{candidate,signal}.py
│       └── data/mock_candidates.py        ← replaced in Phase 2+
└── frontend/                ← Vite + React + TS
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── api/             ← fetch + zod parsing + React Query hooks
        ├── components/      ← layout · candidates · checklist
        ├── pages/           ← Dashboard · Candidate · Matrix
        ├── store/           ← Zustand filters
        ├── types/           ← zod schemas (single source of truth on the FE side)
        └── lib/             ← formatters
```

---

## Next steps (Phase 1)

1. `pip install -e ".[data]"` to pull `jugaad-data`, `yfinance`, `pandas-ta`.
2. Implement `app/ingestion/universe.py` — pull full NSE + BSE symbol master.
3. Implement `app/ingestion/ohlcv.py` — daily bars into per-symbol parquet.
4. Implement `app/analysis/step01_qualifying.py` — the 20–30%/15–30d filter.
5. Wire `app/api/scan.py` to read from the parquet store when `use_mock_data=False`.

The frontend keeps working through every phase because the API contract (defined
once in `backend/app/models/candidate.py` and `frontend/src/types/candidate.ts`)
doesn't move.

---

## Important caveats

- **Research tool, not a broker.** No order routing, no live ticks.
- **Survivorship bias** is real — Phase 8 backtest is the only honest validation.
- **SME / micro-cap** signals are flagged with `low_liquidity: true`. Verify by hand.
- **Gann time cycles** are interpretive; expect false positives at cycle boundaries.
