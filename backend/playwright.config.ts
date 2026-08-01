import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", trace: "on-first-retry" },
  webServer: process.env.START_E2E_SERVER === "true" ? { command: "npm run dev", url: "http://localhost:3000/api/health", reuseExistingServer: true } : undefined,
});
