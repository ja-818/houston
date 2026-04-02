import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5555,
  },
  optimizeDeps: {
    exclude: [
      "@deck-ui/core",
      "@deck-ui/board",
      "@deck-ui/chat",
      "@deck-ui/layout",
      "@deck-ui/events",
      "@deck-ui/memory",
      "@deck-ui/routines",
      "@deck-ui/connections",
      "@deck-ui/skills",
      "@deck-ui/review",
    ],
  },
});
