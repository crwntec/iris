import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export default function Timetable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["timetable", "2026-04-27", "2026-05-03"],
    queryFn: () => api.getTimetable("2026-04-27", "2026-05-03"),
  });

  if (isLoading) return <p>Laden...</p>;
  if (error) return <p>Fehler</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Stundenplan</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
