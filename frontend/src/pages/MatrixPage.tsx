import { useScanLatest } from "@/api/scan";

export function MatrixPage() {
  const { data, isLoading, error } = useScanLatest();

  if (isLoading) return <div className="text-muted">Loading scan…</div>;
  if (error) return <div className="text-bad">{(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Similarity & Co-occurrence</h1>
        <p className="text-sm text-muted">
          What every stock that gave 20–30% in 15–30 days had in common.
        </p>
      </header>

      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-3">Feature frequency (Step 12)</h3>
        <table className="w-full text-sm">
          <thead className="text-muted text-xs uppercase">
            <tr>
              <th className="text-left py-2">Feature</th>
              <th className="text-right">Frequency in cohort</th>
              <th className="text-right">Threshold for next trade</th>
            </tr>
          </thead>
          <tbody>
            {data.feature_frequencies.map((f) => {
              const meets = f.frequency_pct >= 60;
              return (
                <tr key={f.feature} className="border-t border-line/60">
                  <td className="py-1.5">{f.feature}</td>
                  <td className="text-right font-mono">
                    <span className={meets ? "text-good" : "text-muted"}>
                      {f.frequency_pct.toFixed(0)}%
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`chip border ${
                      f.threshold === "Yes"
                        ? "border-good/40 bg-good/15 text-good"
                        : "border-line bg-bg-soft text-muted"
                    }`}>
                      {f.threshold}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-3">Signal co-occurrence</h3>
        <table className="w-full text-sm">
          <thead className="text-muted text-xs uppercase">
            <tr>
              <th className="text-left py-2">Signal A</th>
              <th className="text-left">Signal B</th>
              <th className="text-right">Co-occurrence</th>
              <th className="text-right">Predictive</th>
            </tr>
          </thead>
          <tbody>
            {data.co_occurrence.map((c, i) => (
              <tr key={i} className="border-t border-line/60">
                <td className="py-1.5">{c.signal_a}</td>
                <td>{c.signal_b}</td>
                <td className="text-right font-mono">{c.co_occurrence_pct.toFixed(0)}%</td>
                <td className="text-right">
                  <span className={`chip border ${
                    c.predictive_power === "HIGH"   ? "border-good/40 bg-good/15 text-good" :
                    c.predictive_power === "MEDIUM" ? "border-accent/40 bg-accent/15 text-accent" :
                                                     "border-warn/40 bg-warn/15 text-warn"
                  }`}>
                    {c.predictive_power}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
