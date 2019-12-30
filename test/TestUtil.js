const puppeteer = require("puppeteer")

const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

async function loginVirkailija(page) {
  await navigate(page, "/")

  await page.click("#username")
  await page.keyboard.type(ADMIN_USERNAME)
  await page.click("#password")
  await page.keyboard.type(ADMIN_PASSWORD)

  await Promise.all([
    page.waitForNavigation(),
    page.click("input[type=submit]"),
  ])
}

async function navigate(page, path) {
  const VIRKAILIJA_PORT = 8081
  await page.goto(`http://localhost:${VIRKAILIJA_PORT}${path}`, { waitUntil: "networkidle0" })
}

async function navigateHakija(page, path) {
  const HAKIJA_PORT = 8080
  await page.goto(`http://localhost:${HAKIJA_PORT}${path}`, { waitUntil: "networkidle0" })
}

function describeBrowser(name, func) {
  describe(name, function() {
    this.timeout(60_000)

    before(async function() {
    })

    after(async function() {
    })

    beforeEach(async function() {
      this.browser = await mkBrowser()
      this.page = (await this.browser.pages())[0]
    })

    afterEach(async function() {
      await this.page.close()
      await this.browser.close()
    })

    func()
  })
}

async function mkBrowser(headless = false) {
  return await puppeteer.launch({
    args: headless ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
    slowMo: 0,
    headless: headless,
    timeout: 10_000,
    defaultViewport: { width: 1920, height: 1080 },
  })
}

module.exports = {
  describeBrowser,
  loginVirkailija,
  navigate,
  navigateHakija,
}
