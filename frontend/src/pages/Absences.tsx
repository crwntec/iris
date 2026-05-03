import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export default function Absences() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["absences", "2026-04-27", "2026-05-03"],
    queryFn: () => api.getAbsences("2026-04-01", "2026-05-31"),
  });

  if (isLoading) return <p>Laden...</p>;
  if (error) return <p>Fehler</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Fehlzeiten</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
