import type { Absence } from "@/types/untis";

function parseUntisDate(value: number): Date | null {
  const date = value.toString();
  if (!/^\d{8}$/.test(date)) return null;

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  const result = new Date(Date.UTC(year, month - 1, day));

  if (
    result.getUTCFullYear() !== year ||
    result.getUTCMonth() !== month - 1 ||
    result.getUTCDate() !== day
  ) {
    return null;
  }

  return result;
}

function toUntisDate(date: Date): number {
  return (
    date.getUTCFullYear() * 10000 +
    (date.getUTCMonth() + 1) * 100 +
    date.getUTCDate()
  );
}

function todayAsUtcDate(): Date {
  const today = new Date();
  return new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
}

/**
 * Returns every past or current calendar day covered by open absences.
 * Delays are deliberately omitted because they are not full-day absences.
 */
export function getOpenAbsenceDays(absences: Absence[]): number[] {
  const days = new Set<number>();
  const today = todayAsUtcDate();

  for (const absence of absences) {
    const reason = absence.reason.trim().toLocaleLowerCase("de-DE");
    if (absence.isExcused || reason.includes("verspät")) continue;

    const start = parseUntisDate(absence.startDate);
    const end = parseUntisDate(absence.endDate) ?? start;
    if (!start || !end) continue;

    const lastDay = end < start ? start : end;
    const cursor = new Date(start);
    while (cursor <= lastDay && cursor <= today) {
      days.add(toUntisDate(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  return [...days].sort((a, b) => a - b);
}

/** Returns the current German school year from 1 August through today. */
export function getCurrentSchoolYearRange(referenceDate = new Date()): {
  start: string;
  end: string;
} {
  const startYear =
    referenceDate.getMonth() >= 7
      ? referenceDate.getFullYear()
      : referenceDate.getFullYear() - 1;
  const pad = (value: number) => value.toString().padStart(2, "0");

  return {
    start: `${startYear}-08-01`,
    end: `${referenceDate.getFullYear()}-${pad(referenceDate.getMonth() + 1)}-${pad(referenceDate.getDate())}`,
  };
}

