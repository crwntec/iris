import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around">
      <NavLink to="/timetable">Stundenplan</NavLink>
      <NavLink to="/absences">Fehlzeiten</NavLink>
    </nav>
  );
}
