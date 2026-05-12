import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { registerSW } from "virtual:pwa-register";

const queryClient = new QueryClient();

/**
 * Better control over updates
 */
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("New version available");
    // later: show toast instead of auto reload
  },
  onOfflineReady() {
    console.log("App ready offline");
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
