import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { version } from "./package.json";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APTABASE_APP_KEY__: JSON.stringify(process.env.APTABASE_APP_KEY ?? ""),
  },
  clearScreen: false,
  // Exclude workspace packages from Vite's dep pre-bundling so live edits
  // are picked up immediately without stale cache issues.
  optimizeDeps: {
    exclude: [
      "@houston-ai/chat",
      "@houston-ai/core",
      "@houston-ai/board",
      "@houston-ai/layout",
      "@houston-ai/events",
      "@houston-ai/routines",
      "@houston-ai/skills",
      "@houston-ai/review",
      "@houston-ai/agent",
    ],
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
