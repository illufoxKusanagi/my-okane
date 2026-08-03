import { defineVitestConfig } from "@nuxt/test-utils/config";
import path from "node:path";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    globals: true,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
  ssr: {
    external: ["bun:test"],
  },
  resolve: {
    alias: {
      "bun:test": path.resolve(__dirname, "./test/empty-mock.ts"),
    },
  },
});
