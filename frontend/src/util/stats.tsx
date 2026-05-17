import type { Stats, SubjectStats, TeacherStats } from "@/types/app";
import type { Lesson, Timetable } from "@/types/untis";

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
export function computeStats(timetable: Timetable): Stats {
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
export function getBarColor(cancelled: number, substitute: number): string {
  if (cancelled > 0) return "bg-rose-500";
  if (substitute > 0) return "bg-amber-500";
  return "bg-zinc-500";
}
