import { cn } from "@/util";

// ─────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────
export function StatusAccent({ isExcused }: { isExcused: boolean }) {
  return (
    <div
      className={cn(
        "absolute left-0 top-0 h-full w-1",
        isExcused ? "bg-emerald-500" : "bg-rose-500",
      )}
    />
  );
}
export function StatCard({
  value,
  label,
  color,
  loading = false,
}: {
  value?: number;
  label: string;
  color?: "emerald" | "rose";
  loading?: boolean;
}) {
  const colorClasses = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-zinc-800 p-4 backdrop-blur flex-1 min-w-[90px] animate-pulse">
        <div className="h-8 w-12 bg-zinc-800 rounded mb-2" />
        <div className="h-3 w-16 bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-zinc-800 p-4 backdrop-blur flex-1 min-w-[90px]">
      <p
        className={cn(
          "text-3xl font-bold tabular-nums",
          color ? colorClasses[color] : "text-white",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-zinc-500 mt-1 font-medium uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
export function AbsenceCardSkeleton() {
  return (
    <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4 pl-5 space-y-3 overflow-hidden animate-pulse">
      <div className="absolute left-0 top-0 h-full w-1 bg-zinc-700" />
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-zinc-800 rounded" />
          <div className="h-4 w-32 bg-zinc-800 rounded" />
        </div>
        <div className="h-6 w-20 bg-zinc-800 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-zinc-800 rounded-full" />
        <div className="h-5 w-24 bg-zinc-800 rounded-full" />
      </div>
      <div className="h-4 w-full bg-zinc-800 rounded" />
    </div>
  );
}
