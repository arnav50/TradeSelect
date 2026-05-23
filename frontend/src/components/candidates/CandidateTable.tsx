import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import type { Candidate } from "@/types/candidate";
import { useFilters } from "@/store/filters";
import { fmtCr, fmtCurrency } from "@/lib/formatters";
import { ConvictionBar } from "./ConvictionBar";
import { ScoreBadge } from "./ScoreBadge";
import { LiquidityWarning } from "./LiquidityWarning";

type Props = { candidates: Candidate[] };

const ch = createColumnHelper<Candidate>();

export function CandidateTable({ candidates }: Props) {
  const f = useFilters();

  const data = useMemo(
    () =>
      candidates.filter((c) => {
        if (c.scores.conviction_10 < f.minConviction) return false;
        if (f.exchange !== "ALL" && c.exchange !== f.exchange) return false;
        if (f.mcap !== "ALL" && c.mcap_category !== f.mcap) return false;
        if (f.sector !== "ALL" && c.sector !== f.sector) return false;
        if (f.hideIlliquid && c.low_liquidity) return false;
        return true;
      }),
    [candidates, f],
  );

  const columns = useMemo(
    () => [
      ch.accessor("symbol", {
        header: "Symbol",
        cell: (info) => {
          const c = info.row.original;
          return (
            <Link
              to={`/candidate/${c.symbol}`}
              className="font-mono font-semibold text-accent hover:underline"
            >
              {c.symbol}
            </Link>
          );
        },
      }),
      ch.accessor("name", { header: "Name", cell: (i) => <span className="text-slate-300">{i.getValue()}</span> }),
      ch.accessor("exchange", {
        header: "Ex.",
        cell: (i) => <span className="chip border border-line text-muted">{i.getValue()}</span>,
      }),
      ch.accessor("sector", { header: "Sector", cell: (i) => <span className="text-slate-300">{i.getValue()}</span> }),
      ch.accessor("mcap_category", {
        header: "Cap",
        cell: (i) => <span className="chip border border-line text-muted">{i.getValue()}</span>,
      }),
      ch.accessor((r) => r.scores.conviction_10, {
        id: "conviction",
        header: "Conviction",
        cell: (i) => {
          const c = i.row.original;
          return (
            <div className="flex items-center gap-2">
              <ConvictionBar value={c.scores.conviction_10} />
              {c.scores.high_priority && (
                <span className="chip border bg-accent/20 text-accent border-accent/40">⭐ HIGH</span>
              )}
            </div>
          );
        },
        sortingFn: (a, b) => a.original.scores.conviction_10 - b.original.scores.conviction_10,
      }),
      ch.display({
        id: "subscores",
        header: "SMC / Gann / Classical",
        cell: (i) => {
          const s = i.row.original.scores;
          return (
            <div className="flex gap-1">
              <ScoreBadge label="SMC" value={s.smc} max={5} />
              <ScoreBadge label="Gann" value={s.gann} max={5} />
              <ScoreBadge label="TA" value={s.classical} max={5} />
            </div>
          );
        },
      }),
      ch.accessor("last_price", {
        header: "LTP",
        cell: (i) => <span className="font-mono">{fmtCurrency(i.getValue())}</span>,
      }),
      ch.display({
        id: "setup",
        header: "Entry / SL / Tgt",
        cell: (i) => {
          const s = i.row.original.setup;
          return (
            <div className="font-mono text-xs leading-tight">
              <div>
                E <span className="text-slate-300">{fmtCurrency(s.entry_zone_low)}–{fmtCurrency(s.entry_zone_high)}</span>
              </div>
              <div className="text-bad">SL {fmtCurrency(s.stop_loss)}</div>
              <div className="text-good">T {fmtCurrency(s.target_low)}–{fmtCurrency(s.target_high)}</div>
            </div>
          );
        },
      }),
      ch.accessor((r) => r.setup.rr_ratio, {
        id: "rr",
        header: "R:R",
        cell: (i) => <span className="font-mono">{i.getValue().toFixed(2)}</span>,
      }),
      ch.accessor("avg_daily_volume_cr", {
        header: "Avg Vol",
        cell: (i) => {
          const c = i.row.original;
          return (
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs">{fmtCr(i.getValue())}</span>
              {c.low_liquidity && <LiquidityWarning />}
            </div>
          );
        },
      }),
    ],
    [],
  );

  const [sorting, setSorting] = useState<SortingState>([{ id: "conviction", desc: true }]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-bg-soft border-b border-line">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-3 py-2 text-left font-medium text-muted cursor-pointer select-none"
                  onClick={h.column.getToggleSortingHandler()}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-line/60 hover:bg-bg-soft/60">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-muted">
                No candidates match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
