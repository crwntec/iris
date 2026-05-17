export function formatUntisDate(date: number): string {
  const str = date.toString();
  return `${str.slice(6, 8)}.${str.slice(4, 6)}.${str.slice(0, 4)}`;
}
export function formatUntisTime(time: number): string {
  const str = time < 1000 ? `0${time}` : time.toString();
  return `${str.slice(0, 2)}:${str.slice(2, 4)}`;
}
export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}
export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  // const sameMonth =
  //   s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();

  // if (sameMonth) {
  //   return `${s.toLocaleDateString("de-DE", { month: "short", year: "numeric" })} – ${e.toLocaleDateString("de-DE", { month: "short", year: "numeric" })}`;
  // }
  return `${s.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })} – ${e.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}`;
}

export const PRESETS = ["7T", "30T", "Monat", "Semester"];

// ─────────────────────────────────────────────────────────────
// Date Helpers
// ─────────────────────────────────────────────────────────────
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfSemester(date: Date): Date {
  // Simplified: Feb-Jul = H2, Aug-Jan = H1
  const month = date.getMonth(); // 0-11
  if (month >= 1 && month <= 6) {
    return new Date(date.getFullYear(), 1, 1); // Feb 1
  }
  return new Date(date.getFullYear(), 7, 1); // Aug 1
}

function endOfSemester(date: Date): Date {
  const month = date.getMonth();
  if (month >= 1 && month <= 6) {
    return new Date(date.getFullYear(), 6, 31); // Jul 31
  }
  return new Date(date.getFullYear() + 1, 0, 31); // Jan 31 next year
}

export function getDateRangeForPreset(
  preset: string,
  referenceDate = new Date(),
): { start: string; end: string } {
  const today = referenceDate;
  let start: Date,
    end: Date = today;

  switch (preset) {
    case "7T":
      start = addDays(today, -6);
      break;
    case "30T":
      start = addDays(today, -29);
      break;
    case "Monat":
      start = startOfMonth(today);
      end = endOfMonth(today);
      break;
    case "Semester":
      start = startOfSemester(today);
      end = endOfSemester(today);
      break;
    default:
      start = addDays(today, -29);
  }

  // Format as YYYY-MM-DD for API
  const toISO = (d: Date) => d.toISOString().split("T")[0];
  return { start: toISO(start), end: toISO(end) };
}

export function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64url);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
