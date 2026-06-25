import type { ChangeLogEntry, DashboardData } from "@/types/app";
import type { Absences, Timetable } from "@/types/untis";

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
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null as T;
  }
  return res.json();
}
export const api = {
  login: (username: string, password: string) =>
    request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getTimetable: (start: string, end: string): Promise<Timetable> =>
    request(`/untis/timetable?start=${start}&end=${end}`),

  getAbsences: (start: string, end: string): Promise<Absences> =>
    request(`/untis/absences?start=${start}&end=${end}`),

  savePushSubscription: (subscription: PushSubscriptionJSON) =>
    request("/push/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    }),
  unsubscribePush: () =>
    request("/push/unsubscribe", {
      method: "POST",
    }),
  testPush: () =>
    request("/push/test", {
      method: "POST",
    }),
  getChangeLog: () => request<ChangeLogEntry[]>("/untis/changelog"),
  getPushVapidKey: (): Promise<{ publicKey: string }> =>
    request("/push/vapid-public-key"),
  getDashboard: () => request<DashboardData>("/admin/dashboard"),
};
