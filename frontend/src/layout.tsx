import { Outlet } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";

export default function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
