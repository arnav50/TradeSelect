type Props = {
  label: string;
  value: number;       // 0..5 or 0..10
  max: number;
};

export function ScoreBadge({ label, value, max }: Props) {
  const pct = (value / max) * 100;
  const color =
    pct >= 80 ? "bg-good/20 text-good border-good/40" :
    pct >= 60 ? "bg-accent/20 text-accent border-accent/40" :
    pct >= 40 ? "bg-warn/20 text-warn border-warn/40" :
                "bg-bad/20 text-bad border-bad/40";

  return (
    <span className={`chip border ${color}`}>
      {label} {value}/{max}
    </span>
  );
}
