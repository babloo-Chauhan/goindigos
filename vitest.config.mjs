import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.js"],
    coverage: {
      // Browser components and stores are covered by the Playwright tests, which this report does not measure.
      include: [
        "app/data/jobs.js",
        "app/lib/adminAuth.js",
        "app/lib/adminValidation.js",
        "app/lib/contentStore.js",
        "app/lib/idLists.js",
        "app/lib/site.js",
        "app/lib/structuredData.js",
      ],
      reporter: ["text"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
