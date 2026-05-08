import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Absences from "./pages/Absences";
import Login from "./pages/Login";
import Layout from "./layout";
import TimetableStats from "./pages/TimetableStats";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" />;
  return children;
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/absences" replace /> },
      { path: "absences", element: <Absences /> },
      { path: "stats", element: <TimetableStats /> },
    ],
  },
]);
