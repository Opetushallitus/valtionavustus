const puppeteer = require("puppeteer")

const HAKIJA_HOSTNAME = process.env.HAKIJA_HOSTNAME || 'localhost'
const HAKIJA_PORT = 8080

const VIRKAILIJA_HOSTNAME = process.env.VIRKAILIJA_HOSTNAME || 'localhost'
const VIRKAILIJA_PORT = 8081

const VIRKAILIJA_URL = `http://${VIRKAILIJA_HOSTNAME}:${VIRKAILIJA_PORT}`
const HAKIJA_URL = `http://${HAKIJA_HOSTNAME}:${HAKIJA_PORT}`

async function navigate(page, path) {
  await page.goto(`${VIRKAILIJA_URL}${path}`, { waitUntil: "networkidle0" })
}

async function navigateHakija(page, path) {
  await page.goto(`${HAKIJA_URL}${path}`, { waitUntil: "networkidle0" })
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
  VIRKAILIJA_URL,
  HAKIJA_URL
}
