import type { Absences } from "../types/untis";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) throw new Error(await res.text());

  return res.json();
}
export const api = {
  login: (username: string, password: string) =>
    request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getTimetable: (start: string, end: string) =>
    request(`/untis/timetable?start=${start}&end=${end}`),

  getAbsences: (start: string, end: string): Promise<Absences> =>
    request(`/untis/absences?start=${start}&end=${end}`),
};
