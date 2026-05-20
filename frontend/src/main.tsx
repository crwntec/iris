import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { registerSW } from "virtual:pwa-register";
import moment from "moment";

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
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
  let startX = 0;
  let startY = 0;

  window.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - startX;
      const dy = y - startY;

      const screenWidth = window.innerWidth;
      const edgeThreshold = 24; // px from left/right edge
      const nearEdge =
        startX < edgeThreshold || startX > screenWidth - edgeThreshold;

      // Block only horizontal swipes near screen edges (browser nav zone)
      if (nearEdge && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
        e.preventDefault();
      }
    },
    { passive: false },
  );
}
moment.locale("de");
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
