import { useScanLatest } from "@/api/scan";
import { CandidateTable } from "@/components/candidates/CandidateTable";

export function DashboardPage() {
  const { data, isLoading, error } = useScanLatest();

  if (isLoading) return <div className="text-muted">Loading latest scan…</div>;
  if (error) return <div className="text-bad">Failed to load scan: {(error as Error).message}</div>;
  if (!data) return null;

  const high = data.candidates.filter((c) => c.scores.high_priority).length;

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold">Latest scan — {data.scan_date}</h1>
          <p className="text-sm text-muted">
            Cohort of {data.cohort_size} stocks that gave 20–30% in 15–30 days · {data.candidates.length} forward candidates · {high} flagged HIGH PRIORITY
          </p>
        </div>
      </header>

      <CandidateTable candidates={data.candidates} />
    </div>
  );
}
