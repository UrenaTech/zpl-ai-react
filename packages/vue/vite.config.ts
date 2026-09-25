import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ include: ["src"], exclude: ["test"] })],
  build: {
    rollupOptions: {
      external: ["vue", "@urenatech/zpl-core"]
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
