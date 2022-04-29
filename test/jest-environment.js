const NodeEnvironment = require("jest-environment-node");
const moment = require("moment");
const fs = require("fs");

class FailedTestContextEnvironment extends NodeEnvironment {
  async handleTestEvent(event, _state) {
    if (event.name === "test_fn_failure") {
      await saveScreenshot(this.global.puppeteerPage, event.test.name);
    }
    if (event.name === "hook_failure") {
      await saveScreenshot(
        this.global.puppeteerPage,
        `hook-${event.hook.type}-${event.hook.parent.name}`
      );
    }
  }
}

async function saveScreenshot(page, currentTest) {
  const dir = `${__dirname}/screenshots`;
  function log(...args) {
    console.log(moment().format("YYYY-MM-DD HH:mm:ss.SSSS"), ...args);
  }
  function toFileName(s) {
    return s.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  function makeScreenshotDirectoryIfNotExists() {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  if (!page) {
    log("Page is not defined, cannot take screenshot");
    return;
  }

  makeScreenshotDirectoryIfNotExists();
  const url = await page.evaluate(() => window.location.href);
  const path = `${dir}/${toFileName(currentTest)}.png`;
  log(`Saving Puppeteer screenshot from url ${url} to ${path}`);
  await page.screenshot({ path, fullPage: true });
}

module.exports = FailedTestContextEnvironment;
