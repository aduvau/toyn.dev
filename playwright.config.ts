import { defineConfig, devices } from "@playwright/test";

// Visual regression (ADR-0004) and browser QA scripts (`*.e2e.ts`, ADR-0005). `bun test` runs
// everything else; it ignores both suffixes.
const PORT = 4173;

export default defineConfig({
  testDir: "tests/visual",
  testMatch: ["*.visual.ts", "*.e2e.ts"],
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}-{platform}{ext}",
  outputDir: "test-results",
  reporter: [["list"], ["html", { open: "never" }]],
  forbidOnly: true,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  },
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide" } },
  projects: [{ name: "chromium" }],
  webServer: {
    command: `bun tests/visual/serve.ts ${PORT}`,
    url: `http://localhost:${PORT}/system/`,
    reuseExistingServer: false,
  },
});
