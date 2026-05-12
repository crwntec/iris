import { createBrowserRouter, Navigate } from "react-router-dom";
import Absences from "./pages/Absences";
import Login from "./pages/Login";
import Layout from "./layout";
import TimetableStats from "./pages/TimetableStats";
import ProtectedRoute from "./ProtectedRoute";

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
