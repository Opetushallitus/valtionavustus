const puppeteer = require("puppeteer")

const HAKIJA_HOSTNAME = process.env.HAKIJA_HOSTNAME || 'localhost'
const VIRKAILIJA_HOSTNAME = process.env.VIRKAILIJA_HOSTNAME || 'localhost'

async function navigate(page, path) {
  const VIRKAILIJA_PORT = 8081
  await page.goto(`http://${VIRKAILIJA_HOSTNAME}:${VIRKAILIJA_PORT}${path}`, { waitUntil: "networkidle0" })
}

async function navigateHakija(page, path) {
  const HAKIJA_PORT = 8080
  await page.goto(`http://${HAKIJA_HOSTNAME}:${HAKIJA_PORT}${path}`, { waitUntil: "networkidle0" })
}

function describeBrowser(name, func) {
  describe(name, function() {
    this.timeout(100_000)

    before(async function() {
    })

    after(async function() {
    })

    beforeEach(async function() {
      this.browser = await mkBrowser(process.env['HEADLESS'] === 'true')
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
  navigate,
  navigateHakija,
}
