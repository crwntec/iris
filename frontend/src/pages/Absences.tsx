import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import {
  cn,
  formatDateRange,
  formatUntisDate,
  formatUntisTime,
  getDateRangeForPreset,
  PRESETS,
} from "../util";
import { useMemo, useState } from "react";
import { SortAsc, SortDesc, RefreshCw } from "lucide-react";
import type { Absence } from "../types/untis";
import {
  type ApiError,
  ErrorState,
  getErrorMessage,
} from "../components/Error";
// ─────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────
function StatusAccent({ isExcused }: { isExcused: boolean }) {
  return (
    <div
      className={cn(
        "absolute left-0 top-0 h-full w-1",
        isExcused ? "bg-emerald-500" : "bg-rose-500",
      )}
    />
  );
}

function StatCard({
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

function AbsenceCardSkeleton() {
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

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function Absences() {
  const [activePreset, setActivePreset] = useState("30T");
  const { start: startDate, end: endDate } = useMemo(
    () => getDateRangeForPreset(activePreset),
    [activePreset],
  );

  const { data, isLoading, error, isFetching, refetch, dataUpdatedAt } =
    useQuery({
      queryKey: ["absences", startDate, endDate],
      queryFn: () => api.getAbsences(startDate, endDate),
      staleTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, err: ApiError) => {
        // Only retry network/server errors, not auth errors
        const { recoverable } = getErrorMessage(err);
        return recoverable && failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // Exponential backoff
    });

  const [asc, setAsc] = useState(false);

  // Show error state only if we have no data AND an error
  if (error && !data) {
    return <ErrorState error={error as ApiError} onRetry={() => refetch()} />;
  }

  const absences = data?.absences ?? [];
  const excused = absences.filter((a) => a.isExcused);
  const unexcused = absences.filter((a) => !a.isExcused);

  const toComparable = (a: Absence) => a.startDate * 10000 + a.startTime;
  const sortedAbsences = [...absences].sort((a, b) =>
    asc ? toComparable(a) - toComparable(b) : toComparable(b) - toComparable(a),
  );

  // eslint-disable-next-line react-hooks/purity
  const isStale = Date.now() - dataUpdatedAt > 1000 * 60 * 10;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Stats & Presets */}
      <div className="px-4 pt-8 pb-4 space-y-6">
        {/* Stats Cards */}
        <div className="flex items-center justify-center gap-3">
          {isLoading ? (
            <>
              <StatCard label="Gesamt" loading />
              <StatCard label="Entschuldigt" loading />
              <StatCard label="Offen" loading />
            </>
          ) : (
            <>
              <StatCard value={absences.length} label="Gesamt" />
              <StatCard
                value={excused.length}
                label="Entschuldigt"
                color="emerald"
              />
              <StatCard value={unexcused.length} label="Offen" color="rose" />
            </>
          )}
        </div>

        {/* Presets + Date Range */}
        <div>
          <div className="flex gap-2 overflow-x-auto">
            {PRESETS.map((label) => (
              <button
                key={label}
                onClick={() => setActivePreset(label)}
                disabled={isLoading}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50",
                  activePreset === label
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-zinc-500">
              {formatDateRange(startDate, endDate)}
            </p>
            {isStale && data && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                • Aktualisierung verfügbar
              </span>
            )}
            {isFetching && (
              <RefreshCw size={12} className="text-zinc-500 animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Sticky List Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Fehlzeiten</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLoading ? "Lade…" : `${sortedAbsences.length} Einträge`}
            </p>
          </div>
          <button
            onClick={() => setAsc((prev) => !prev)}
            disabled={isLoading || sortedAbsences.length === 0}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            aria-label="Sortierung umschalten"
          >
            {asc ? (
              <SortAsc size={14} strokeWidth={2} />
            ) : (
              <SortDesc size={14} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Absences List */}
      <div className="px-4 pt-3 space-y-3">
        {isLoading ? (
          // Show skeleton cards while loading
          <>
            {[...Array(3)].map((_, i) => (
              <AbsenceCardSkeleton key={i} />
            ))}
          </>
        ) : sortedAbsences.length > 0 ? (
          // Show actual data
          sortedAbsences.map((absence) => (
            <div
              key={absence.id}
              className={cn(
                "relative rounded-3xl border p-4 pl-5 space-y-3 overflow-hidden transition-colors",
                absence.isExcused
                  ? "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900/80"
                  : "bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30",
              )}
            >
              <StatusAccent isExcused={absence.isExcused} />

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
                    absence.isExcused
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400",
                  )}
                >
                  {absence.isExcused ? "Entschuldigt" : "Offen"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                  {absence.reason}
                </span>
                <span className="text-xs text-zinc-500">
                  {absence.createdUser}
                </span>
              </div>

              {absence.text && (
                <p className="text-xs text-zinc-400 italic leading-relaxed">
                  {absence.text}
                </p>
              )}
            </div>
          ))
        ) : (
          // Empty state
          <div className="text-center py-12 space-y-3">
            <p className="text-zinc-400 text-sm">
              Keine Fehlzeiten in diesem Zeitraum
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setActivePreset("7T")}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Letzte 7 Tage anzeigen
              </button>
              <span className="text-zinc-700">•</span>
              <button
                onClick={() => refetch()}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Aktualisieren
              </button>
            </div>
          </div>
        )}

        {/* Stale data warning */}
        {isStale && data && !isLoading && (
          <div className="px-2 py-3 text-center">
            <button
              onClick={() => refetch()}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <RefreshCw size={12} />
              Daten aktualisieren
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
