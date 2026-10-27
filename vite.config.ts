import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  test: {
    environment: "jsdom",
    setupFiles: ["./src/testSetup.ts"],
    environmentOptions: { jsdom: { url: "http://localhost/" } },
  },
});
