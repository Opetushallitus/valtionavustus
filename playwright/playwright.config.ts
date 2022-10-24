import { PlaywrightTestConfig } from "@playwright/test";

const headless = process.env["HEADLESS"] === "true";
const workersEnv = process.env["PLAYWRIGHT_WORKERS"];
const workersEnvNumber = Number(workersEnv);
const workers = isNaN(workersEnvNumber) ? workersEnv : workersEnvNumber;
const retriesEnv = Number(process.env["PLAYWRIGHT_RETRIES"]);
const retries = isNaN(retriesEnv) ? 2 : retriesEnv;
const allowOnly = process.env["ALLOW_ONLY"] === "true";

const config: PlaywrightTestConfig = {
  forbidOnly: !allowOnly,
  retries,
  workers,
  testDir: "tests",
  timeout: 60000,
  use: {
    actionTimeout: 10000,
    navigationTimeout: 10000,
    headless,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    video: "off",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    testIdAttribute: "data-test-id",
  },
  reportSlowTests: {
    max: 0,
    threshold: 120000,
  },
  reporter: [
    ["list"],
    [
      "junit",
      {
        outputFile: "playwright-results/junit-playwright-js-unit.xml",
      },
    ],
    [
      "html",
      {
        outputFolder: "../playwright-results/html-report/",
        open: "never",
      },
    ],
  ],
};

export default config;
