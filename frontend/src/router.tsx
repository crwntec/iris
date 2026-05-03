import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Absences from "./pages/Absences";
import Login from "./pages/Login";
import Layout from "./layout";
import Timetable from "./pages/Timetable";

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
      { index: true, element: <Navigate to="/timetable" replace /> },
      { path: "timetable", element: <Timetable /> },
      { path: "absences", element: <Absences /> },
    ],
  },
]);
