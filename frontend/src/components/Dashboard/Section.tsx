import { cn } from "@/util";

// ─────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────
export function Section({
  title,
  icon: Icon,
  children,
  highlight = false,
  actions,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  highlight?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-4 space-y-3 backdrop-blur",
        highlight
          ? "border-rose-500/20 bg-rose-500/[0.04]"
          : "border-zinc-800/80 bg-zinc-900/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              size={15}
              className={highlight ? "text-rose-400" : "text-zinc-500"}
            />
          )}
          <h2
            className={cn(
              "text-xs font-bold uppercase tracking-widest",
              highlight ? "text-rose-400/80" : "text-zinc-500",
            )}
          >
            {title}
          </h2>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
