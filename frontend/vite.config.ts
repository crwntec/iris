import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Iris",
        short_name: "Iris",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        start_url: "/",

        icons: [
          {
            src: "/android/launchericon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/android/launchericon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
