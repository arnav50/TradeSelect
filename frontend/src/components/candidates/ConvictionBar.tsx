type Props = { value: number };  // 0..10

export function ConvictionBar({ value }: Props) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  const color =
    value >= 8 ? "bg-good" :
    value >= 6 ? "bg-accent" :
    value >= 4 ? "bg-warn" :
                 "bg-bad";

  return (
    <div className="flex items-center gap-2 w-32">
      <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}
