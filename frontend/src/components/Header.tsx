import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/timetable": "Stundenplan",
  "/absences": "Fehlzeiten",
};

export default function Header() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? "Iris";

  return (
    <header className="bg-zinc-950 text-white px-4 pt-10 pb-4 flex items-center justify-between border-b border-zinc-900">
      <div>
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-0.5">
          Iris
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>
      <span className="text-2xl opacity-60">👁️</span>
    </header>
  );
}
