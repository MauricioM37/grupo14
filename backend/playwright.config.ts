import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", trace: "on-first-retry" },
  webServer: process.env.START_E2E_SERVER === "false" ? undefined : {
    command: "npm run demo:bootstrap && npm run dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: false,
    env: {
      ...process.env,
      ADMIN_BEARER_TOKEN: "playwright-admin-token",
      DATA_ENCRYPTION_KEY: "playwright-data-key",
      NUMBER_HMAC_KEY: "playwright-number-key",
      WHATSAPP_ENABLED: "false",
      WHATSAPP_FAKE: "true",
    },
  },
});
