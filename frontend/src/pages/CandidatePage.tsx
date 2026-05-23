import { Link, useParams } from "react-router-dom";

import { useCandidate } from "@/api/scan";
import { MasterChecklist } from "@/components/checklist/MasterChecklist";
import { fmtCurrency, fmtPct } from "@/lib/formatters";

export function CandidatePage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { data, isLoading, error } = useCandidate(symbol);

  if (isLoading) return <div className="text-muted">Loading {symbol}…</div>;
  if (error) return <div className="text-bad">{(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Link to="/" className="text-xs text-muted hover:text-slate-200">← Back to dashboard</Link>

      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">
            {data.symbol} <span className="text-muted text-sm ml-2">{data.name}</span>
          </h1>
          <p className="text-sm text-muted">
            {data.exchange} · {data.sector} · {data.mcap_category} · LTP {fmtCurrency(data.last_price)}
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold">{data.scores.conviction_10.toFixed(1)}<span className="text-muted text-base">/10</span></div>
          {data.scores.high_priority && (
            <span className="chip border bg-accent/20 text-accent border-accent/40">⭐ HIGH PRIORITY</span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MasterChecklist candidate={data} />

        <div className="card p-4 space-y-3">
          <h3 className="text-lg font-semibold">Trade Setup</h3>
          <div className="font-mono text-sm space-y-1">
            <div>Entry zone: <span className="text-slate-200">{fmtCurrency(data.setup.entry_zone_low)} – {fmtCurrency(data.setup.entry_zone_high)}</span></div>
            <div>Stop loss:  <span className="text-bad">{fmtCurrency(data.setup.stop_loss)}</span></div>
            <div>Target:     <span className="text-good">{fmtCurrency(data.setup.target_low)} – {fmtCurrency(data.setup.target_high)}</span></div>
            <div>R:R:        <span className="text-slate-200">{data.setup.rr_ratio.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="card p-4 space-y-2">
          <h3 className="text-lg font-semibold">Key Indicators</h3>
          <ul className="text-sm font-mono space-y-1">
            <li>RSI(14) D: {data.signals.momentum.rsi_d.toFixed(1)}</li>
            <li>RSI(14) W: {data.signals.momentum.rsi_w.toFixed(1)}</li>
            <li>ADX: {data.signals.momentum.adx.toFixed(1)}</li>
            <li>MACD hist: {data.signals.momentum.macd_hist.toFixed(2)}</li>
            <li>EMA20 slope: {fmtPct(data.signals.trend.ema20_slope_pct)}</li>
            <li>% above EMA200: {fmtPct(data.signals.trend.pct_above_ema200)}</li>
            <li>Volume ×avg: {data.signals.volume.breakout_x_avg.toFixed(2)}</li>
            <li>OBV rising: {data.signals.volume.obv_rising_days}d</li>
            <li>MTF score: {data.signals.mtf_score}/9</li>
          </ul>
        </div>
      </div>

      <div className="card p-4 text-sm text-muted">
        <p>
          Chart with SMC (Order Block / FVG / BOS markers) and Gann (1×1 angle, Square-of-9 lines) overlays
          is wired in Phase 4 / Phase 5 — see <code className="font-mono text-accent">ARCHITECTURE.md</code> §14 roadmap.
        </p>
      </div>
    </div>
  );
}
