import { Outlet } from "react-router-dom";
import BottomNav from "./components/BottomNav";

export default function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
