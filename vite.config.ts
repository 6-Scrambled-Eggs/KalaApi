import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" lets the build run from any static host path (GitHub Pages, Vercel, Netlify).
export default defineConfig({ plugins: [react()], base: "./" });
