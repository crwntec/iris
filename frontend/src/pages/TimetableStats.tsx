import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useMemo, useState } from "react";
import type { Lesson, Timetable } from "@/types/untis";
import type { Stats, SubjectStats, TeacherStats } from "@/types/app";
import { cn, formatDateRange, getDateRangeForPreset, PRESETS } from "@/util";
import { RefreshCw, AlertCircle } from "lucide-react";
import { type ApiError, getErrorMessage } from "@/components/Error";

// ─────────────────────────────────────────────────────────────
// Existing Helpers (unchanged)
// ─────────────────────────────────────────────────────────────
function getPeriod(startTime: string): number {
  const time = startTime.split("T")[1];
  const [h, m] = time.split(":").map(Number);
  const minutes = h * 60 + m;
  const periods = [
    7 * 60 + 40,
    9 * 60 + 20,
    11 * 60 + 15,
    13 * 60 + 50,
    15 * 60 + 25,
  ];
  const index = periods.indexOf(minutes);
  return index >= 0 ? index + 1 : 0;
}

const CANCELLATION_TEACHERS = ["E.V.A.", "TEAMS", ""];

function isCancelled(lesson: Lesson): boolean {
  if (lesson.Status === "CANCELLED") return true;
  if (lesson.Status === "CHANGED") {
    const teacher = lesson.Teacher.Current.Short;
    return CANCELLATION_TEACHERS.includes(teacher);
  }
  return false;
}

function isSubstitute(lesson: Lesson): boolean {
  return lesson.Status === "CHANGED" && !isCancelled(lesson);
}

function computeStats(timetable: Timetable): Stats {
  const subjectMap = new Map<string, SubjectStats>();
  const teacherMap = new Map<string, TeacherStats>();
  const dayMap = new Map<string, number>();
  const periodMap = new Map<number, number>();
  let totalLessons = 0,
    totalCancelled = 0,
    totalSubstitute = 0,
    totalHomework = 0;

  for (const day of timetable.Days) {
    let dayCancelled = 0;
    if (!day.Lessons) continue;
    for (const l of day.Lessons) {
      const subject = l.Subject.Current.Short;
      const teacher = l.Teacher.Planned.Short;
      const cancelled = isCancelled(l);
      const substitute = isSubstitute(l);
      const homework = l.Icons?.includes("HOMEWORK") ?? false;

      totalLessons++;
      if (cancelled) {
        totalCancelled++;
        dayCancelled++;
      }
      if (substitute) totalSubstitute++;
      if (homework) totalHomework++;

      const period = getPeriod(l.Start);
      if (cancelled && period > 0) {
        periodMap.set(period, (periodMap.get(period) ?? 0) + 1);
      }

      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          subject,
          total: 0,
          cancelled: 0,
          substitute: 0,
          homework: 0,
          cancelRate: 0,
        });
      }
      const s = subjectMap.get(subject)!;
      s.total++;
      if (cancelled) s.cancelled++;
      if (substitute) s.substitute++;
      if (homework) s.homework++;

      if (!teacherMap.has(teacher)) {
        teacherMap.set(teacher, {
          teacher,
          total: 0,
          cancelled: 0,
          substitute: 0,
          cancelRate: 0,
          homework: 0,
        });
      }
      const t = teacherMap.get(teacher)!;
      t.total++;
      if (cancelled) t.cancelled++;
      if (substitute) t.substitute++;
      if (homework) t.homework++;
    }
    dayMap.set(day.Date, dayCancelled);
  }

  for (const s of subjectMap.values())
    s.cancelRate = s.total ? s.cancelled / s.total : 0;
  for (const t of teacherMap.values())
    t.cancelRate = t.total ? t.cancelled / t.total : 0;

  const mostCancelledDay = [...dayMap.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0] ?? ["—", 0];
  const mostCancelledPeriod =
    [...periodMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

  return {
    totalLessons,
    totalCancelled,
    totalSubstitute,
    totalHomework,
    mostCancelledDay: { date: mostCancelledDay[0], count: mostCancelledDay[1] },
    mostCancelledPeriod,
    bySubject: [...subjectMap.values()].sort((a, b) => b.total - a.total),
    byTeacher: [...teacherMap.values()].sort((a, b) => b.total - a.total),
  };
}

function getBarColor(cancelled: number, substitute: number): string {
  if (cancelled > 0) return "bg-rose-500";
  if (substitute > 0) return "bg-amber-500";
  return "bg-zinc-500";
}

const maxBar = (vals: number[]) => Math.max(...vals, 1);

// ─────────────────────────────────────────────────────────────
// Subcomponents: Loading Skeletons
// ─────────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="flex-1 min-w-[100px] bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 animate-pulse">
      <div className="h-7 w-10 bg-zinc-800 rounded mb-2" />
      <div className="h-3 w-16 bg-zinc-800 rounded" />
    </div>
  );
}

function StatCard({
  label,
  value,
  colorClass,
  loading = false,
}: {
  label: string;
  value?: number;
  colorClass: string;
  loading?: boolean;
}) {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className="flex-1 min-w-[100px] bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
      <p className={cn("text-2xl font-bold tabular-nums", colorClass)}>
        {value}
      </p>
      <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

function ChartSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-zinc-800 rounded" />
            <div className="h-4 w-12 bg-zinc-800 rounded" />
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <section className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800">
      <div className="h-3 w-24 bg-zinc-800 rounded mb-4" />
      <ChartSkeleton />
    </section>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: ApiError | null;
  onRetry: () => void;
}) {
  const { title, message, recoverable } = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="text-rose-400" size={40} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-zinc-400 mt-1">{message}</p>
        </div>
        {recoverable && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} />
            Erneut versuchen
          </button>
        )}
        {!recoverable && (
          <p className="text-xs text-zinc-500">
            Bei anhaltenden Problemen wende dich bitte an den Support.
          </p>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  highlight = false,
  loading = false,
}: {
  title: string;
  children?: React.ReactNode;
  highlight?: boolean;
  loading?: boolean;
}) {
  if (loading) return <SectionSkeleton />;

  return (
    <section
      className={cn(
        "bg-zinc-900 rounded-2xl px-4 py-4 border",
        highlight ? "border-rose-900/60" : "border-zinc-800",
      )}
    >
      <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function TimetableStats() {
  const [activePreset, setActivePreset] = useState("30T");
  const { start: startDate, end: endDate } = useMemo(
    () => getDateRangeForPreset(activePreset),
    [activePreset],
  );

  const { data, isLoading, error, isFetching, refetch, dataUpdatedAt } =
    useQuery({
      queryKey: ["timetable", startDate, endDate],
      queryFn: () => api.getTimetable(startDate, endDate),
      staleTime: 1000 * 60 * 10,
      retry: (failureCount, err: ApiError) => {
        const { recoverable } = getErrorMessage(err);
        return recoverable && failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    });

  const stats = useMemo(() => {
    if (!data) return null;
    return computeStats(data);
  }, [data]);

  const { subjectMax, teacherMax, topHomeworkTeachers } = useMemo(() => {
    if (!stats)
      return {
        subjectMax: 1,
        teacherMax: 1,
        topHomeworkTeachers: [] as TeacherStats[],
      };
    return {
      subjectMax: maxBar(stats.bySubject.map((s) => s.total)),
      teacherMax: maxBar(stats.byTeacher.map((t) => t.total)),
      topHomeworkTeachers: stats.byTeacher
        .filter((t) => t.homework > 0)
        .sort((a, b) => b.homework - a.homework)
        .slice(0, 5),
    };
  }, [stats]);

  // Show error state only if we have no data AND an error
  if (error && !data) {
    return <ErrorState error={error as ApiError} onRetry={() => refetch()} />;
  }

  const cancelRate = stats?.totalLessons
    ? (stats.totalCancelled / stats.totalLessons) * 100
    : 0;

  // eslint-disable-next-line react-hooks/purity
  const isStale = Date.now() - dataUpdatedAt > 1000 * 60 * 10;

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 pt-6 pb-24 space-y-5">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Statistiken</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {formatDateRange(startDate, endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isStale && data && (
            <button
              onClick={() => refetch()}
              className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Aktualisieren
            </button>
          )}
          {isFetching && (
            <RefreshCw size={14} className="text-zinc-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRESETS.map((label) => (
          <button
            key={label}
            onClick={() => setActivePreset(label)}
            disabled={isLoading}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50",
              activePreset === label
                ? "bg-zinc-100 text-zinc-900 shadow-sm"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hero Stats */}
      <div className="flex flex-wrap gap-3">
        {isLoading ? (
          <>
            <StatCard label="Stunden" colorClass="text-white" loading />
            <StatCard label="Ausgefallen" colorClass="text-rose-400" loading />
            <StatCard label="Vertretung" colorClass="text-amber-400" loading />
            <StatCard label="Hausaufgaben" colorClass="text-sky-400" loading />
          </>
        ) : stats ? (
          <>
            <StatCard
              label="Stunden"
              value={stats.totalLessons}
              colorClass="text-white"
            />
            <StatCard
              label="Ausgefallen"
              value={stats.totalCancelled}
              colorClass="text-rose-400"
            />
            <StatCard
              label="Vertretung"
              value={stats.totalSubstitute}
              colorClass="text-amber-400"
            />
            <StatCard
              label="Hausaufgaben"
              value={stats.totalHomework}
              colorClass="text-sky-400"
            />
          </>
        ) : null}
      </div>

      {/* Cancellation Rate */}
      {isLoading ? (
        <Section title="Ausfallquote" loading />
      ) : stats?.totalLessons ? (
        <Section title="Ausfallquote">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${cancelRate}%` }}
                role="progressbar"
                aria-valuenow={Math.round(cancelRate)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="text-sm font-semibold text-rose-400 tabular-nums w-12 text-right">
              {Math.round(cancelRate)}%
            </span>
          </div>
        </Section>
      ) : null}

      {/* Most Homework Teachers */}
      {isLoading ? (
        <Section title="Meiste Hausaufgaben" loading />
      ) : topHomeworkTeachers.length > 0 ? (
        <Section title="Meiste Hausaufgaben">
          <div className="space-y-2">
            {topHomeworkTeachers.map((t) => (
              <div
                key={t.teacher}
                className="flex justify-between items-center py-1"
              >
                <span className="text-sm text-zinc-200">{t.teacher}</span>
                <span className="text-xs text-sky-400 tabular-nums font-medium">
                  {t.homework}×
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Subjects */}
      {isLoading ? (
        <Section title="Fächer" loading />
      ) : stats ? (
        <Section title="Fächer">
          <div className="space-y-4">
            {stats.bySubject.map((s) => (
              <div key={s.subject}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-zinc-200">
                    {s.subject}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    {s.cancelled > 0 && (
                      <span className="text-rose-400 font-medium">
                        {s.cancelled}✗
                      </span>
                    )}
                    {s.substitute > 0 && (
                      <span className="text-amber-400 font-medium">
                        {s.substitute}↔
                      </span>
                    )}
                    <span className="text-zinc-500 tabular-nums">
                      {s.total}×
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      getBarColor(s.cancelled, s.substitute),
                    )}
                    style={{ width: `${(s.total / subjectMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Teachers */}
      {isLoading ? (
        <Section title="Lehrer" loading />
      ) : stats ? (
        <Section title="Lehrer">
          <div className="space-y-4">
            {stats.byTeacher.map((t) => (
              <div key={t.teacher}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-zinc-200">
                    {t.teacher}
                  </span>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {t.total}×
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-500 rounded-full transition-all"
                    style={{ width: `${(t.total / teacherMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Most Cancelled Period */}
      {isLoading ? (
        <Section title="Fällt am häufigsten aus" loading highlight />
      ) : stats?.mostCancelledPeriod ? (
        <Section title="Fällt am häufigsten aus" highlight>
          <p className="text-2xl font-bold text-rose-400">
            {stats.mostCancelledPeriod}. Block
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {stats.bySubject.find((s) => s.cancelled > 0)?.subject && (
              <>
                Häufig betroffen:{" "}
                {stats.bySubject.find((s) => s.cancelled > 0)?.subject}
              </>
            )}
          </p>
        </Section>
      ) : null}

      {/* Empty State (no lessons in range) */}
      {!isLoading && stats && stats.totalLessons === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-zinc-400 text-sm">
            Keine Stunden in diesem Zeitraum
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
    </div>
  );
}
