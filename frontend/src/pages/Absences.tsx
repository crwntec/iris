import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { cn, formatDateRange, getDateRangeForPreset } from "@/util";
import { getCurrentSchoolYearRange, getOpenAbsenceDays } from "@/util/excuses";
import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import {
  SortAsc,
  SortDesc,
  RefreshCw,
  HelpCircle,
  Filter,
  Printer,
} from "lucide-react";
import type { Absence } from "@/types/untis";
import { type ApiError, ErrorState, getErrorMessage } from "@/components/Error";
import {
  StatCard,
  AbsenceCardSkeleton,
  HelpModal,
  AbsenceCard,
  FilterModal,
  type AbsenceFilter,
} from "@/components/Absences";
import {
  ExcusePrintDocument,
  type ExcusePrintData,
} from "@/components/Absences/ExcusePrintDocument";
import PresetButtons from "@/components/PresetButtons";

const STALE_TIME = 1000 * 60 * 10;
const iconBtn =
  "h-9 w-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 transition-transform duration-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100";

export default function Absences() {
  const [activePreset, setActivePreset] = useState("30T");
  const [showHelp, setShowHelp] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [asc, setAsc] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<AbsenceFilter>>(
    new Set(),
  );
  const [printData, setPrintData] = useState<ExcusePrintData | null>(null);

  const { start: startDate, end: endDate } = useMemo(
    () => getDateRangeForPreset(activePreset),
    [activePreset],
  );
  const schoolYearRange = useMemo(() => getCurrentSchoolYearRange(), []);

  const { data, isLoading, error, isFetching, refetch, dataUpdatedAt } =
    useQuery({
      queryKey: ["absences", startDate, endDate],
      queryFn: () => api.getAbsences(startDate, endDate),
      staleTime: STALE_TIME,
      retry: (failureCount, err: ApiError) => {
        const { recoverable } = getErrorMessage(err);
        return recoverable && failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    });

  const {
    data: schoolYearData,
    isLoading: isSchoolYearLoading,
    isError: hasSchoolYearError,
  } = useQuery({
    queryKey: ["absences", schoolYearRange.start, schoolYearRange.end],
    queryFn: () =>
      api.getAbsences(schoolYearRange.start, schoolYearRange.end),
    staleTime: STALE_TIME,
    retry: (failureCount, err: ApiError) => {
      const { recoverable } = getErrorMessage(err);
      return recoverable && failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const openSchoolYearDays = useMemo(
    () => getOpenAbsenceDays(schoolYearData?.absences ?? []),
    [schoolYearData],
  );

  const printExcuse = (absenceDays: number[]) => {
    if (absenceDays.length === 0) return;

    // Keep this synchronous with the tap/click. Safari then presents its native
    // print sheet instead of treating it as a blocked popup.
    flushSync(() => {
      setPrintData({ absenceDays, issuedAt: new Date() });
    });
    document.body.classList.add("printing-excuse");
    window.print();
  };

  useEffect(() => {
    const resetPrintDocument = () => {
      document.body.classList.remove("printing-excuse");
      setPrintData(null);
    };

    window.addEventListener("afterprint", resetPrintDocument);
    return () => {
      window.removeEventListener("afterprint", resetPrintDocument);
      document.body.classList.remove("printing-excuse");
    };
  }, []);

  if (error && !data) {
    return <ErrorState error={error as ApiError} onRetry={() => refetch()} />;
  }

  const absences = data?.absences ?? [];
  const excused = absences.filter((a) => a.isExcused);
  const unexcused = absences.filter((a) => !a.isExcused);
  // eslint-disable-next-line react-hooks/purity
  const isStale = Date.now() - dataUpdatedAt > STALE_TIME;

  const toggleFilter = (key: AbsenceFilter) =>
    setActiveFilters((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const filteredAbsences =
    activeFilters.size === 0
      ? absences
      : absences.filter((a) => {
          if (activeFilters.has("excused") && a.isExcused) return false;
          if (activeFilters.has("partial") && a.hasPartialExcuseStatus)
            return false;
          if (activeFilters.has("open") && !a.isExcused) return false;
          if (activeFilters.has("late") && a.reason === "verspätet")
            return false;
          return true;
        });

  const sortedAbsences = [...filteredAbsences].sort((a, b) => {
    const key = (x: Absence) => x.startDate * 10000 + x.startTime;
    return asc ? key(a) - key(b) : key(b) - key(a);
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Stats & Presets */}
      <div className="px-4 pt-8 pb-4 space-y-6">
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

        <div>
          <PresetButtons
            activePreset={activePreset}
            setActivePreset={setActivePreset}
            isLoading={isLoading}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-zinc-500">
              {formatDateRange(startDate, endDate)}
            </p>
            {isStale && data && (
              <span className="text-[10px] text-amber-400">
                • Aktualisierung verfügbar
              </span>
            )}
            {isFetching && (
              <RefreshCw size={12} className="text-zinc-500 animate-spin" />
            )}
          </div>

          {!hasSchoolYearError && (
            <button
              type="button"
              onClick={() => printExcuse(openSchoolYearDays)}
              disabled={isSchoolYearLoading || openSchoolYearDays.length === 0}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
            >
              <Printer size={16} strokeWidth={1.75} />
              {isSchoolYearLoading
                ? "Offene Fehltage laden…"
                : openSchoolYearDays.length === 0
                  ? "Keine offenen Fehltage"
                  : `Alle ${openSchoolYearDays.length} offenen Fehltage entschuldigen`}
            </button>
          )}
        </div>
      </div>

      {/* Sticky List Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Abwesenheiten
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLoading ? "Lade…" : `${sortedAbsences.length} Einträge`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className={iconBtn}
              aria-label="Hilfe"
            >
              <HelpCircle size={14} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => setShowFilter(true)}
              className={cn(iconBtn, "relative")}
              aria-label="Filter"
            >
              <Filter size={14} strokeWidth={1.5} />
              {activeFilters.size > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>

            <button
              onClick={() => setAsc((prev) => !prev)}
              disabled={isLoading || sortedAbsences.length === 0}
              className={iconBtn}
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
      </div>

      {/* Absences List */}
      <div className="px-4 pt-3 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <AbsenceCardSkeleton key={i} />)
        ) : sortedAbsences.length > 0 ? (
          sortedAbsences.map((absence) => {
            const absenceDays = getOpenAbsenceDays([absence]);

            return (
              <AbsenceCard
                key={absence.id}
                absence={absence}
                onPrint={
                  absenceDays.length > 0
                    ? () => printExcuse(absenceDays)
                    : undefined
                }
              />
            );
          })
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-zinc-400 text-sm">
              Keine Abwesenheiten in diesem Zeitraum
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
                <RefreshCw size={12} /> Aktualisieren
              </button>
            </div>
          </div>
        )}

        {isStale && data && !isLoading && (
          <div className="px-2 py-3 text-center">
            <button
              onClick={() => refetch()}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <RefreshCw size={12} /> Daten aktualisieren
            </button>
          </div>
        )}
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          activeFilters={activeFilters}
          onToggle={toggleFilter}
        />
      )}
      {printData && <ExcusePrintDocument {...printData} />}
    </div>
  );
}

