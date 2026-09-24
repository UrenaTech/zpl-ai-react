import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      exclude: ["test"]
    })
  ],
  build: {
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: { banner: '"use client";' }
    },
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format) => format === "es" ? "index.mjs" : "index.cjs"
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"]
  }
});
