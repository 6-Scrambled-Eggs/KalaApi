import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" lets the build run from any static host path (GitHub Pages, Vercel, Netlify).
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/maplibre-gl")) return "maplibre";
          if (id.includes("node_modules/echarts") || id.includes("node_modules/zrender")) return "echarts";
        },
      },
    },
  },
});
