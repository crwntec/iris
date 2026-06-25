import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import Onboarding from "@/components/Onboarding";

export default function Layout() {
  return (
    <div className="flex flex-col h-dvh bg-zinc-950 text-white overflow-hidden">
      <Onboarding />
      <Header />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
