import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.houston.companion",
  appName: "Houston",
  webDir: "dist",
  server: {
    // During development, use the Vite dev server
    // url: "http://localhost:5173",
    // cleartext: true,
  },
};

export default config;
