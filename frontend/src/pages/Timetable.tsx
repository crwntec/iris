import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export default function Timetable() {
  const { isLoading, error } = useQuery({
    queryKey: ["timetable", "2026-04-27", "2026-05-03"],
    queryFn: () => api.getTimetable("2026-04-27", "2026-05-03"),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <p className="text-sm text-zinc-400 tracking-widest uppercase animate-pulse">
          Laden…
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <p className="text-sm text-rose-400">Fehler beim Laden</p>
      </div>
    );

  return (
    <div className="min-h-full bg-zinc-950 text-white px-4 pt-8 pb-24">
      <pre className="text-xs text-zinc-400">coming soon</pre>
    </div>
  );
}
