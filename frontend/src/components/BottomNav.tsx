import { NavLink } from "react-router-dom";
import { ClipboardList, BarChart2, BellIcon, InfoIcon } from "lucide-react";

const links = [
  { to: "/absences", label: "Fehlstunden", Icon: ClipboardList },
  { to: "/stats", label: "Statistik", Icon: BarChart2 },
  { to: "/alerts", label: "Nachrichten", Icon: BellIcon },
  { to: "/about", label: "App", Icon: InfoIcon },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around px-4">
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-colors ${
              isActive ? "text-white" : "text-zinc-600 hover:text-zinc-400"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className={`text-xs ${isActive ? "font-medium" : ""}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-2 w-1 h-1 rounded-full bg-white" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
