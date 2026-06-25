import { createBrowserRouter, Navigate } from "react-router-dom";
import Absences from "@/pages/Absences";
import Login from "@/pages/Login";
import Layout from "@/layout";
import TimetableStats from "@/pages/Stats";
import Alerts from "@/pages/Alerts";
import ProtectedRoute from "@/ProtectedRoute";
import About from "@/pages/About";
import Dashboard from "@/pages/Dashboard";

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
      { path: "alerts", element: <Alerts /> },
      { path: "about", element: <About /> },
      { path: "dashboard", element: <Dashboard /> },
    ],
  },
]);
