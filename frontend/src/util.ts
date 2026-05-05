export function formatUntisDate(date: number): string {
  const str = date.toString();
  return `${str.slice(6, 8)}.${str.slice(4, 6)}.${str.slice(0, 4)}`;
}
export function formatUntisTime(time: number): string {
  const str = time < 1000 ? `0${time}` : time.toString();
  return `${str.slice(0, 2)}:${str.slice(2, 4)}`;
}
