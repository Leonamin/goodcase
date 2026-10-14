import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  timeout: 30000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5179",
    headless: true,
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:5179",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
