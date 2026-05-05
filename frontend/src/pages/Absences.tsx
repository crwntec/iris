import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { formatUntisDate, formatUntisTime } from "../util";

type Absence = {
  id: number;
  startDate: number;
  endDate: number;
  startTime: number;
  endTime: number;
  reason: string;
  text: string;
  isExcused: boolean;
  createdUser: string;
  excuseStatus: string;
};

export default function Absences() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["absences", "2026-04-01", "2026-05-31"],
    queryFn: () => api.getAbsences("2026-04-01", "2026-05-31"),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading)
    return (
      <div className="flex bg-zinc-950 items-center justify-center h-full">
        <p className="text-sm text-gray-400 tracking-widest uppercase animate-pulse">
          Laden…
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex bg-zinc-950 items-center justify-center h-full">
        <p className="text-sm text-red-400">Fehler beim Laden</p>
      </div>
    );

  const excused = data?.absences.filter((a: Absence) => a.isExcused) ?? [];
  const unexcused = data?.absences.filter((a: Absence) => !a.isExcused) ?? [];

  return (
    <div className="min-h-full bg-zinc-950 text-white px-4 pt-8 pb-24">
      <div className="mb-8">
        <div className="flex gap-4 mt-3">
          <div className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3">
            <p className="text-3xl font-bold text-white">
              {data?.absences.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">
              Gesamt
            </p>
          </div>
          <div className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3">
            <p className="text-3xl font-bold text-emerald-400">
              {excused.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">
              Entschuldigt
            </p>
          </div>
          <div className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3">
            <p className="text-3xl font-bold text-rose-400">
              {unexcused.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">
              Offen
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data?.absences.map((absence: Absence) => (
          <div
            key={absence.id}
            className={`rounded-2xl px-4 py-4 border ${
              absence.isExcused
                ? "bg-zinc-900 border-zinc-800"
                : "bg-zinc-900 border-rose-900"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  {formatUntisDate(absence.startDate)}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatUntisTime(absence.startTime)} –{" "}
                  {formatUntisTime(absence.endTime)}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  absence.isExcused
                    ? "bg-emerald-950 text-emerald-400"
                    : "bg-rose-950 text-rose-400"
                }`}
              >
                {absence.isExcused ? "Entschuldigt" : "Offen"}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                {absence.reason}
              </span>
              <span className="text-xs text-zinc-600">
                {absence.createdUser}
              </span>
            </div>

            {absence.text && (
              <p className="mt-2 text-xs text-zinc-400 italic">
                {absence.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
