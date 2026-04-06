import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.tsx",
      formats: ["es"],
      fileName: () => "bundle.js",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@houston-ai/core",
        "@houston-ai/chat",
        "@houston-ai/board",
        "@houston-ai/layout",
      ],
    },
    outDir: ".",
    emptyOutDir: false,
  },
});
