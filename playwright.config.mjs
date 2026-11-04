import { defineConfig } from "@playwright/test";
import { ADMIN_E2E } from "./tests/e2e/adminEnv.mjs";

const PORT = 3105;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  workers: 2,
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
  },
  webServer: [
    {
      // No database or admin login, so the public tests always see the samples and the panel stays locked.
      command: `npm run start -- -p ${PORT}`,
      env: { ADMIN_USERNAME: "", ADMIN_PASSWORD: "", ADMIN_SESSION_SECRET: "", MONGODB_URI: "" },
      port: PORT,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // A second server with its own throwaway database, so admin edits cannot disturb the public tests.
      command: `npm run start -- -p ${ADMIN_E2E.port}`,
      env: ADMIN_E2E.env,
      port: ADMIN_E2E.port,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
