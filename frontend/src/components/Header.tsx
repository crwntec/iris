import { useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

const titles: Record<string, string> = {
  "/absences": "Fehlzeiten",
  "/stats": "Statistik",
  "/alerts": "Nachrichten",
};

export default function Header() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? "Dashboard";

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="bg-zinc-950 text-white px-6 pt-8 pb-5 flex items-center justify-between border-b border-zinc-900">
      {/* Left identity block (matches login branding) */}
      <div className="flex flex-row items-center justify-between">
        <img src="/favicon.ico" alt="IRIS" className="w-8 h-8" />
        <div className="ml-2 flex flex-col">
          <p className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase">
            iris
          </p>
          <h1 className="text-lg font-medium tracking-tight text-white">
            {title}
          </h1>
        </div>
      </div>

      {/* Right action */}
      <button
        onClick={logout}
        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}
