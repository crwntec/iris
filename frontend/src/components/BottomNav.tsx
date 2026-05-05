import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around px-4">
      <NavLink
        to="/absences"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs tracking-widest uppercase transition-colors ${
            isActive ? "text-white" : "text-zinc-600"
          }`
        }
      >
        <span className="text-lg">📋</span>
        Fehlzeiten
      </NavLink>
      <NavLink
        to="/timetable"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs tracking-widest uppercase transition-colors ${
            isActive ? "text-white" : "text-zinc-600"
          }`
        }
      >
        <span className="text-lg">📅</span>
        Stundenplan
      </NavLink>
    </nav>
  );
}
