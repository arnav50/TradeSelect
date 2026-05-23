import type { Candidate } from "@/types/candidate";

type Row = { group: "SMC" | "Gann" | "Classical"; label: string; pass: boolean };

function rowsFor(c: Candidate): Row[] {
  const s = c.signals;
  return [
    { group: "SMC", label: "BOS confirmed on Daily",                            pass: s.smc.bos },
    { group: "SMC", label: "Bullish Order Block mitigated",                     pass: s.smc.ob_mitigated },
    { group: "SMC", label: "FVG present and partially/fully filled",            pass: s.smc.fvg_filled },
    { group: "SMC", label: "Equal Highs swept within prior 3–5 days",           pass: s.smc.eqh_swept_recent },
    { group: "SMC", label: "Entry in Discount / OTE (61.8–79%)",                pass: s.smc.in_ote_zone },

    { group: "Gann", label: "Price above 1×1 Gann angle from recent low",       pass: s.gann.above_1x1 },
    { group: "Gann", label: "Entry near Gann Square-of-9 cardinal level",       pass: s.gann.near_sq9_cardinal },
    { group: "Gann", label: "Prior pullback ≈ 50% (Gann natural retracement)",  pass: s.gann.pullback_50pct },
    { group: "Gann", label: "Breakout aligned with Gann 30/90-day cycle",       pass: s.gann.time_cycle_align },
    { group: "Gann", label: "144-period MA acting as dynamic support",          pass: s.gann.ma144_support },

    { group: "Classical", label: "EMA 9 > 20 > 50 > 200 full bullish stack",    pass: s.trend.ema_stack_bullish },
    { group: "Classical", label: "RSI(14) Daily between 50–70 and rising",      pass: s.momentum.rsi_d >= 50 && s.momentum.rsi_d <= 70 && s.momentum.rsi_rising },
    { group: "Classical", label: "MACD histogram positive, cross ≤ 5 days",     pass: s.momentum.macd_hist > 0 && s.momentum.macd_cross_within_5d },
    { group: "Classical", label: "Breakout volume ≥ 2× 20-day average",         pass: s.volume.breakout_x_avg >= 2 },
    { group: "Classical", label: "Sector outperforming Nifty 500 last 5–10d",   pass: s.sector.outperforming_nifty },
  ];
}

export function MasterChecklist({ candidate }: { candidate: Candidate }) {
  const rows = rowsFor(candidate);
  const passed = rows.filter((r) => r.pass).length;

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-lg font-semibold">Master Entry Checklist</h3>
        <div className="font-mono text-sm">
          <span className={passed >= 10 ? "text-good" : passed >= 7 ? "text-accent" : "text-warn"}>
            {passed}/15
          </span>
          {passed >= 10 && <span className="ml-2 chip border bg-accent/20 text-accent border-accent/40">⭐ HIGH PRIORITY</span>}
        </div>
      </div>

      {(["SMC", "Gann", "Classical"] as const).map((g) => (
        <div key={g} className="mb-3 last:mb-0">
          <div className="text-xs uppercase tracking-wide text-muted mb-1">{g}</div>
          <ul className="space-y-1">
            {rows.filter((r) => r.group === g).map((r) => (
              <li key={r.label} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 inline-block w-4 h-4 rounded border ${
                  r.pass ? "bg-good/30 border-good text-good" : "bg-line border-line text-muted"
                } flex items-center justify-center text-[10px] font-bold`}>
                  {r.pass ? "✓" : ""}
                </span>
                <span className={r.pass ? "text-slate-200" : "text-muted line-through"}>{r.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
