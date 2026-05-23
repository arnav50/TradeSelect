import { Link, NavLink, Outlet } from "react-router-dom";
import { useFilters } from "@/store/filters";

export function AppShell() {
  const f = useFilters();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-line bg-bg-soft p-4 flex flex-col gap-6">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Trade<span className="text-accent">Select</span>
        </Link>

        <nav className="flex flex-col gap-1 text-sm">
          {[
            { to: "/", label: "Dashboard" },
            { to: "/matrix", label: "Similarity Matrix" },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md ${
                  isActive ? "bg-accent/15 text-accent" : "text-slate-300 hover:bg-bg-card"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="card p-3 text-sm space-y-3">
          <div className="text-xs uppercase tracking-wide text-muted">Filters</div>

          <label className="block">
            <div className="flex items-center justify-between text-xs">
              <span>Min Conviction</span>
              <span className="font-mono">{f.minConviction.toFixed(1)}</span>
            </div>
            <input
              type="range" min={0} max={10} step={0.5}
              value={f.minConviction}
              onChange={(e) => f.set({ minConviction: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </label>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={f.hideIlliquid}
              onChange={(e) => f.set({ hideIlliquid: e.target.checked })}
            />
            Hide low-liquidity (SME / micro)
          </label>

          <button
            className="w-full px-2 py-1 rounded-md border border-line text-xs text-muted hover:text-slate-200"
            onClick={() => f.reset()}
          >
            Reset
          </button>
        </div>

        <div className="mt-auto text-[11px] text-muted leading-relaxed">
          Research tool. EOD data, 15-min delayed intraday. SME signals are noisy — verify manually.
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
