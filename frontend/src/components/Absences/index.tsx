import type { Absence } from "@/types/untis";
import { cn, formatUntisDate, formatUntisTime } from "@/util";
import { Clock } from "lucide-react";
// define the filter shape
export type AbsenceFilter = "excused" | "open" | "partial" | "late";

const FILTERS: { key: AbsenceFilter; label: string }[] = [
  { key: "excused", label: "Entschuldigt" },
  { key: "partial", label: "Teilweise" },
  { key: "open", label: "Offen" },
  { key: "late", label: "Verspätet" },
];
// ─────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────
export function StatusAccent({ excuseStatus }: { excuseStatus: number }) {
  return (
    <div
      className={cn(
        "absolute left-0 top-0 h-full w-1",
        excuseStatus === 1
          ? "bg-emerald-500"
          : excuseStatus === 0
            ? "bg-rose-500"
            : excuseStatus === 3
              ? "bg-pink-500"
              : "bg-orange-500",
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

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">Farbgebung</h2>
        <div className="space-y-3">
          {[
            { color: "bg-emerald-500", label: "Entschuldigt" },
            {
              color: "bg-amber-500",
              label: "Möglicherweise nicht alle Stunden entschuldigt",
            },
            { color: "bg-rose-500", label: "Offen / unentschuldigt" },
            { color: "bg-pink-500", label: "Verspätet" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={cn("w-3 h-3 rounded-full shrink-0", color)} />
              <p className="text-sm text-zinc-300">{label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 rounded-2xl bg-zinc-800 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}

export function AbsenceCard({ absence }: { absence: Absence }) {
  const excuseStatus = absence.hasPartialExcuseStatus
    ? 2
    : absence.isExcused
      ? 1
      : absence.reason === "verspätet"
        ? 3
        : 0;

  return (
    <div
      className={cn(
        "relative rounded-3xl border p-4 pl-5 space-y-3 overflow-hidden transition-colors",
        excuseStatus === 1
          ? "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900/80"
          : "",
        excuseStatus === 2
          ? "bg-amber-950/20 border-amber-900/30 hover:bg-amber-950/30"
          : "",
        excuseStatus === 0
          ? "bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30"
          : "",
        excuseStatus === 3
          ? "bg-pink-950/20 border-pink-900/40 hover:bg-pink-950/30"
          : "",
      )}
    >
      <StatusAccent excuseStatus={excuseStatus} />

      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white">
            {formatUntisDate(absence.startDate)}
          </h3>
          <p className="text-sm text-zinc-400 mt-0.5">
            {formatUntisTime(absence.startTime)} –{" "}
            {formatUntisTime(absence.endTime)}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-xs font-medium px-2 py-1 rounded-full",
            excuseStatus === 1 ? "bg-emerald-500/10 text-emerald-400" : "",
            excuseStatus === 2 ? "bg-amber-500/10 text-amber-400" : "",
            excuseStatus === 0 ? "bg-rose-500/10 text-rose-400" : "",
            excuseStatus === 3 ? "bg-pink-500/10 text-pink-400" : "",
          )}
        >
          {excuseStatus === 1
            ? "Entschuldigt"
            : excuseStatus === 2
              ? "Teilweise"
              : excuseStatus === 3
                ? "Verspätet"
                : "Offen"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
          {absence.reason}
        </span>
        <span className="text-xs font-medium bg-zinc-700/60 text-zinc-200 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock size={10} strokeWidth={2} className="text-zinc-400" />
          {absence.affectedLessons} Std.
        </span>
        <span className="text-xs text-zinc-500">{absence.createdUser}</span>
      </div>

      {absence.text && (
        <p className="text-xs text-zinc-400 italic leading-relaxed">
          {absence.text}
        </p>
      )}
    </div>
  );
}

function ToggleSwitch({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-200 pointer-events-none",
        !active ? "bg-green-500" : "bg-zinc-700",
      )}
    >
      <span
        className={cn(
          "absolute top-1 w-4 h-4 rounded-full transition-transform duration-200",
          !active ? "translate-x-1 bg-zinc-900" : "-translate-x-4 bg-zinc-400",
        )}
      />
    </div>
  );
}

export function FilterModal({
  onClose,
  activeFilters,
  onToggle,
}: {
  onClose: () => void;
  activeFilters: Set<AbsenceFilter>;
  onToggle: (key: AbsenceFilter) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Filter</h2>
          {activeFilters.size > 0 && (
            <button
              onClick={() =>
                FILTERS.forEach(
                  (f) => activeFilters.has(f.key) && onToggle(f.key),
                )
              }
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Zurücksetzen
            </button>
          )}
        </div>

        <div className="space-y-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="w-full flex items-center justify-between py-2.5 active:opacity-70 transition-opacity"
            >
              <span className="text-sm text-zinc-300">{label}</span>
              <ToggleSwitch active={activeFilters.has(key)} />
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-zinc-800 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Fertig
        </button>
      </div>
    </div>
  );
}
