import { Browser, Page } from 'puppeteer'
import moment from 'moment'

import {
  mkBrowser,
  log,
  waitUntilMinEmails,
  getAcceptedPäätösEmails,
  getFirstPage,
  setPageErrorConsoleLogger,
  expectToBeDefined,
  randomString,
  getLinkToMuutoshakemusFromSentEmails,
  ratkaiseBudjettimuutoshakemusEnabledAvustushaku,
  clickElement,
  getElementInnerText,
  clearAndType,
  hasElementAttribute,
  navigate
} from './test-util'

function createRandomHakuValues() {
  return {
    registerNumber: "230/2015",
    avustushakuName: `Testiavustushaku (Muutospäätösprosessi) ${randomString()} - ${moment(new Date()).format('YYYY-MM-DD hh:mm:ss:SSSS')}`
  }
}

const answers = {
  contactPersonEmail: "erkki.esimerkki@example.com",
  contactPersonName: "Erkki Esimerkki",
  contactPersonPhoneNumber: "666",
  projectName: "Rahassa kylpijät Ky Ay Oy",
}

jest.setTimeout(400_000)

describe('Talousarvion muuttaminen', () => {
  let browser: Browser
  let page: Page

  beforeEach(() => {
    log(`Starting test: ${expect.getState().currentTestName}`)
  })

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)
  })

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  describe("Hakija haluaa tehdä muutoshakemuksen talouden käyttösuunnitelmaan", () => {
    let linkToMuutoshakemus: string
    let avustushakuID: number
    let hakemusID: number
    const haku = createRandomHakuValues()

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushaku(page, haku, answers)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
      linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(avustushakuID, hakemusID)
      expectToBeDefined(linkToMuutoshakemus)
      await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
      await clickElement(page, '#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan')
    })

    it('ja oppia mahdollisuudesta tehdä muutoksia talouden käyttösuunnitelmaa hakemuksen päätöksen s.postista', async () => {
      const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, avustushakuID, hakemusID)
      emails.forEach(email => {
        const emailContent = email.formatted
        expect(emailContent).toContain('- Hakea muutosta hankkeen talouden käyttösuunnitelmaan')
      })
    })

    it('ja nähdä voimassaolevan talousarvion klikattuaan “Haen muutosta hankkeen talouden käyttösuunnitelmaan” checkboksia', async () => {
      const budgetRowSelector = '[data-test-id=meno-input-row]'
      const budgetExpectedItems = [
        { description: 'Henkilöstömenot', amount: '200000 €' },
        { description: 'Aineet, tarvikkeet ja tavarat', amount: '3000 €' },
        { description: 'Laitehankinnat', amount: '10000 €' },
        { description: 'Palvelut', amount: '100 €' },
        { description: 'Vuokrat', amount: '161616 €' },
        { description: 'Matkamenot', amount: '100 €' },
        { description: 'Muut menot', amount: '10000000 €' }
      ]

      await page.waitForSelector(budgetRowSelector)

      const budgetRows = await page.$$eval(budgetRowSelector, elements => {
        return elements.map(elem => ({
          description: elem.querySelector('.description')?.textContent,
          amount: elem.querySelector('.existingAmount')?.textContent
        }))
      })
      expect(budgetRows).toEqual(budgetExpectedItems)
    })

    it('ja nähdä esitäytetyt menoluokat', async () => {
      const expectedBudgetInputs = [
        { name: 'talousarvio.personnel-costs-row', amount: 200000 },
        { name: 'talousarvio.material-costs-row', amount: 3000 },
        { name: 'talousarvio.equipment-costs-row', amount: 10000 },
        { name: 'talousarvio.service-purchase-costs-row', amount: 100 },
        { name: 'talousarvio.rent-costs-row', amount: 161616 },
        { name: 'talousarvio.steamship-costs-row', amount: 100 },
        { name: 'talousarvio.other-costs-row', amount: 10000000 }
      ]

      const budgetRows = await page.$$eval('[data-test-id=meno-input]', elements => {
        return elements.map(elem => ({
          name: elem.querySelector('input')?.getAttribute('name'),
          amount: parseInt(elem.querySelector('input')?.getAttribute('value') || '')
        }))
      })
      expect(budgetRows).toEqual(expectedBudgetInputs)
    })

    it('ja nähdä talousarvion yhteissumman muuttuvan', async () => {
      const originalSum = await getElementInnerText(page, '[data-test-id=original-sum]')
      expect(originalSum).toEqual('10374816 €')
      const currentSum = await getElementInnerText(page, '[data-test-id=current-sum]')
      expect(currentSum).toEqual('10374816')

      await clearAndType(page, 'input[name="talousarvio.personnel-costs-row"]', '200001')
      const originalSum2 = await getElementInnerText(page, '[data-test-id=original-sum]')
      expect(originalSum2).toEqual('10374816 €')
      const currentSum2 = await getElementInnerText(page, '[data-test-id=current-sum]')
      expect(currentSum2).toEqual('10374817')

      await clearAndType(page, 'input[name="talousarvio.personnel-costs-row"]', '200000')
      const currentSum3 = await getElementInnerText(page, '[data-test-id=current-sum]')
      expect(currentSum3).toEqual('10374816')
    })

    async function busywaitForSendButton(enabled: boolean) {
      while (true) {
        const isDisabled = await hasElementAttribute(page, '#send-muutospyynto-button', 'disabled')
        if (isDisabled !== enabled) {
          return true
        }
      }
    }

    it('requires perustelut', async () => {
      await clearAndType(page, '#perustelut-taloudenKayttosuunnitelmanPerustelut', '')
      await busywaitForSendButton(false)
      const errorMessage = await getElementInnerText(page, '#perustelut-taloudenKayttosuunnitelmanPerustelut + .muutoshakemus__error-message')
      expect(errorMessage).toEqual('Pakollinen kenttä')

      await clearAndType(page, '#perustelut-taloudenKayttosuunnitelmanPerustelut', 'perustelu')

      await busywaitForSendButton(true)
      const noErrorMessage = await getElementInnerText(page, '#perustelut-taloudenKayttosuunnitelmanPerustelut + .muutoshakemus__error-message')
      expect(noErrorMessage).toEqual('')
    })

    it('requires current sum to match the original sum', async () => {
      await clearAndType(page, '#perustelut-taloudenKayttosuunnitelmanPerustelut', 'perustelu')
      await busywaitForSendButton(true)

      await clearAndType(page, 'input[name="talousarvio.equipment-costs-row"]', '9999')

      await busywaitForSendButton(false)
      const sumErrorMessage = await getElementInnerText(page, '[data-test-id=current-sum-error]')
      expect(sumErrorMessage).toEqual('Loppusumman on oltava 10374816')

      await clearAndType(page, 'input[name="talousarvio.material-costs-row"]', '3001')

      await busywaitForSendButton(true)
      const noSumErrorMessage = await getElementInnerText(page, '[data-test-id=current-sum-error]')
      expect(noSumErrorMessage).toEqual('')
    })
  })


  describe("Virkailija käsittelee muutoshakemuksen talouden käyttösuunnitelmaan", () => {
    let linkToMuutoshakemus: string
    let avustushakuID: number
    let hakemusID: number
    const haku = createRandomHakuValues()

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushaku(page, haku, answers)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
      linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(avustushakuID, hakemusID)
      expectToBeDefined(linkToMuutoshakemus)
      await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
      await clickElement(page, '#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan')
      await clearAndType(page, 'input[name="talousarvio.equipment-costs-row"]', '8999')
      await clearAndType(page, 'input[name="talousarvio.material-costs-row"]', '4001')
      await clearAndType(page, 'input[name="talousarvio.personnel-costs-row"]', '200100')
      await clearAndType(page, 'input[name="talousarvio.steamship-costs-row"]', '0')
      await clearAndType(page, '#perustelut-taloudenKayttosuunnitelmanPerustelut', 'perustelu')
      await clickElement(page, "#send-muutospyynto-button")
      await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
      await clickElement(page, 'span.muutoshakemus-tab')
    })

    it('näkee nykyisen talouden käyttösuunnitelman', async () => {
      const budgetRowSelector = '[data-test-id=meno-input-row]'
      const budgetExpectedItems = [
        { description: 'Henkilöstömenot', amount: '200000 €' },
        { description: 'Aineet, tarvikkeet ja tavarat', amount: '3000 €' },
        { description: 'Laitehankinnat', amount: '10000 €' },
        { description: 'Palvelut', amount: '100 €' },
        { description: 'Vuokrat', amount: '161616 €' },
        { description: 'Matkamenot', amount: '100 €' },
        { description: 'Muut menot', amount: '10000000 €' }
      ]

      await page.waitForSelector(budgetRowSelector)
      const budgetRows = await page.$$eval(budgetRowSelector, elements => {
        return elements.map(elem => ({
          description: elem.querySelector('.description')?.textContent,
          amount: elem.querySelector('.existingAmount')?.textContent
        }))
      })
      expect(budgetRows).toEqual(budgetExpectedItems)
    })

    it('näkee haetun talouden käyttösuunnitelman', async () => {
      const budgetRowSelector = '[data-test-id=meno-input-row]'
      const budgetExpectedItems = [
        { description: 'Henkilöstömenot', amount: '200100' },
        { description: 'Aineet, tarvikkeet ja tavarat', amount: '4001' },
        { description: 'Laitehankinnat', amount: '8999' },
        { description: 'Palvelut', amount: '100' },
        { description: 'Vuokrat', amount: '161616' },
        { description: 'Matkamenot', amount: '0' },
        { description: 'Muut menot', amount: '10000000' }
      ]

      await page.waitForSelector(budgetRowSelector)
      const budgetRows = await page.$$eval(budgetRowSelector, elements => {
        return elements.map(elem => ({
          description: elem.querySelector('.description')?.textContent,
          amount: elem.querySelector('.changedAmount')?.textContent
        }))
      })
      expect(budgetRows).toEqual(budgetExpectedItems)
    })

    it('näkee talouden käyttösuunnitelman muutoksen perustelut', async () => {
      const budgetReason = '[data-test-id="muutoshakemus-talousarvio-perustelu"]'
      await page.waitForSelector(budgetReason)
      const perustelu = await getElementInnerText(page, budgetReason)
      expect(perustelu).toEqual('perustelu')
    })
  })
})
