// ─────────────────────────────────────────────────────────────
// Leaderboard — top teachers / subjects by cancellation count
// ─────────────────────────────────────────────────────────────
export function Leaderboard({
  entries,
  unit,
}: {
  entries?:
    { teacher: string; count: number }[] | { subject: string; count: number }[];
  unit: string;
}) {
  const sorted = Object.entries(entries ?? {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <p className="text-xs text-zinc-600 py-2">
        Keine Ausfälle in diesem Zeitraum.
      </p>
    );
  }

  const max = sorted[0][1];

  return (
    <div className="space-y-2.5">
      {sorted.map(([name, count], i) => (
        <div key={name} className="space-y-1">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="flex items-center gap-2 text-zinc-300 font-medium min-w-0">
              <span className="text-[10px] text-zinc-600 tabular-nums w-3 shrink-0">
                {i + 1}
              </span>
              <span className="truncate">{name}</span>
            </span>
            <span className="text-zinc-500 tabular-nums shrink-0">
              {count}× {unit}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-600/70 to-rose-400"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
