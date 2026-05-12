import { Outlet } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";

export default function Layout() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-white">
      <Header />
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
