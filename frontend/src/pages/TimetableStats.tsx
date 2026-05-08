import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useMemo } from "react";
import type { Lesson, Timetable } from "../types/untis";
import type { Stats, SubjectStats, TeacherStats } from "../types/app";

function getPeriod(startTime: string): number {
  const time = startTime.split("T")[1]; // "07:40"
  const [h, m] = time.split(":").map(Number);
  const minutes = h * 60 + m;

  // Stundenbeginn-Zeiten deiner Schule
  const periods = [
    7 * 60 + 40, // 1. Stunde
    9 * 60 + 20, // 2. Stunde
    11 * 60 + 15, // 3. Stunde
    13 * 60 + 50, // 4. Stunde
    15 * 60 + 25, // 5. Stunde
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
  if (lesson.Status !== "CHANGED") return false;
  return !isCancelled(lesson);
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
    for (let i = 0; i < day.Lessons.length; i++) {
      const l = day.Lessons[i];
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
      if (cancelled && period > 0)
        periodMap.set(period, (periodMap.get(period) ?? 0) + 1);
      if (!subjectMap.has(subject))
        subjectMap.set(subject, {
          subject,
          total: 0,
          cancelled: 0,
          substitute: 0,
          homework: 0,
          cancelRate: 0,
        });
      const s = subjectMap.get(subject)!;
      s.total++;
      if (cancelled) s.cancelled++;
      if (substitute) s.substitute++;
      if (homework) s.homework++;

      if (!teacherMap.has(teacher))
        teacherMap.set(teacher, {
          teacher,
          total: 0,
          cancelled: 0,
          substitute: 0,
          cancelRate: 0,
          homework: 0,
        });
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

const maxBar = (vals: number[]) => Math.max(...vals, 1);

export default function TimetableStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["timetable", "2026-04-01", "2026-05-08"],
    queryFn: () => api.getTimetable("2026-02-09", "2026-05-15"),
    staleTime: 1000 * 60 * 10,
  });

  const stats = useMemo(() => {
    if (!data) return null;
    return computeStats(data as Timetable);
  }, [data]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <p className="text-xs text-zinc-600 tracking-widest uppercase animate-pulse">
          Analysiere…
        </p>
      </div>
    );

  if (error || !stats)
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <p className="text-xs text-rose-500">Fehler beim Laden</p>
      </div>
    );

  const subjectMax = maxBar(stats.bySubject.map((s) => s.total));
  const teacherMax = maxBar(stats.byTeacher.map((t) => t.total));

  return (
    <div className="min-h-full bg-zinc-950 text-white px-4 pt-6 pb-24 space-y-6">
      {/* Hero numbers */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Stunden", value: stats.totalLessons, color: "text-white" },
          {
            label: "Ausgefallen",
            value: stats.totalCancelled,
            color: "text-rose-400",
          },
          {
            label: "Vertretung",
            value: stats.totalSubstitute,
            color: "text-amber-400",
          },
          {
            label: "Hausaufgaben",
            value: stats.totalHomework,
            color: "text-sky-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800"
          >
            <p className={`text-3xl font-bold tabular-nums ${color}`}>
              {value}
            </p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Ausfallquote */}
      {stats.totalLessons > 0 && (
        <div className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
            Ausfallquote
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{
                  width: `${(stats.totalCancelled / stats.totalLessons) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm font-semibold text-rose-400 tabular-nums w-10 text-right">
              {((stats.totalCancelled / stats.totalLessons) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {stats.totalHomework > 0 && (
        <div className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
            Meiste Hausaufgaben
          </p>
          {stats.byTeacher
            .filter((t) => t.homework > 0)
            .sort((a, b) => b.homework - a.homework)
            .map((t) => (
              <div
                key={t.teacher}
                className="flex justify-between items-center py-1"
              >
                <span className="text-sm text-zinc-200">{t.teacher}</span>
                <span className="text-xs text-sky-400 tabular-nums">
                  {t.homework}×
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Fächer */}
      <div className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
          Fächer
        </p>
        <div className="space-y-3">
          {stats.bySubject.map((s) => (
            <div key={s.subject}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-zinc-200">
                  {s.subject}
                </span>
                <div className="flex items-center gap-2">
                  {s.cancelled > 0 && (
                    <span className="text-xs text-rose-400">
                      {s.cancelled}✗
                    </span>
                  )}
                  {s.substitute > 0 && (
                    <span className="text-xs text-amber-400">
                      {s.substitute}↔
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {s.total}×
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(s.total / subjectMax) * 100}%`,
                    background:
                      s.cancelled > 0
                        ? "rgb(244 63 94)"
                        : s.substitute > 0
                          ? "rgb(251 191 36)"
                          : "rgb(161 161 170)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lehrer */}
      <div className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
          Lehrer
        </p>
        <div className="space-y-3">
          {stats.byTeacher.map((t) => (
            <div key={t.teacher}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-zinc-200">
                  {t.teacher}
                </span>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {t.total}×
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-500 rounded-full"
                  style={{ width: `${(t.total / teacherMax) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meistausfallende Stunde */}
      {stats.mostCancelledPeriod > 0 && (
        <div className="bg-zinc-900 rounded-2xl px-4 py-4 border border-rose-900">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">
            Fällt am häufigsten aus
          </p>
          <p className="text-2xl font-bold text-rose-400">
            {stats.mostCancelledPeriod}. Block
          </p>
        </div>
      )}
    </div>
  );
}
