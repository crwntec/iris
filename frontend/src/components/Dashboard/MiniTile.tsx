// ─────────────────────────────────────────────────────────────
// Mini tile
// ─────────────────────────────────────────────────────────────
export function MiniTile({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-zinc-800/40 rounded-2xl p-3 space-y-1.5 border border-zinc-800/60">
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color }} />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-zinc-200 tabular-nums">
        {value}
      </p>
    </div>
  );
}
