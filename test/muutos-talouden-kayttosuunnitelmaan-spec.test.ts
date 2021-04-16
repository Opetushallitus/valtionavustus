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
  fillMuutoshakemusPaatosWithVakioperustelu,
  navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges,
  acceptMuutoshakemusAndSendPaatosToHakija,
  countElements,
  navigate,
  Budget,
  BudgetAmount
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


  describe('When avustushaku has been created and hakemus has been submitted', () => {
    let avustushakuID: number
    let hakemusID: number
    const haku = createRandomHakuValues()
    const budget: Budget = {
      amount: {
        personnel: '300',
        material: '420',
        equipment: '1337',
        'service-purchase': '5318008',
        rent: '69',
        steamship: '0',
        other: '9000',
      },
      description: {
        personnel: 'One euro for each of our Spartan workers',
        material: 'Generic materials for innovation',
        equipment: 'We need elite level equipment',
        'service-purchase': 'We need some afterwork fun',
        rent: 'More afterwork fun',
        steamship: 'No need for steamship, we have our own yacht',
        other: 'For power ups',
      },
      selfFinancing: '1',
    }

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushaku(page, haku, answers, budget)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
    })

    describe('And muutoshakemus #1 has been submitted with jatkoaika and budget changes', () => {
      const muutoshakemus1Budget = {
        personnel: '301',
        material: '421',
        equipment: '1338',
        'service-purchase': '5318007',
        rent: '68',
        steamship: '0',
        other: '8999',
      }

      const muutoshakemus1Perustelut = 'Pitäis päästä poistaa jotain akuuttii.... koodaile jotai jos mitää ois poistaa palaillaa sit mo'

      const jatkoaika = {
        jatkoaika: moment(new Date()).add(1, 'days').locale('fi'),
        jatkoaikaPerustelu: 'Duubiduubi-laa'
      }

      beforeAll(async () => {
        await navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges(page, avustushakuID, hakemusID, jatkoaika, muutoshakemus1Budget, muutoshakemus1Perustelut)
      })

      async function getNewHakemusExistingBudget() {
        return getNewHakemusBudget('current')
      }
      async function getNewHakemusMuutoshakemusBudget() {
        return getNewHakemusBudget('muutoshakemus')
      }

      type BudgetRow = {
        name: string
        amount: string
      }

      function budgetRowsToBudgetAmount(rows: BudgetRow[]): BudgetAmount {
        return rows.reduce((p, c) => ({...p, ...{[c.name]: c.amount}}), {}) as BudgetAmount
      }

      async function getNewHakemusBudget(type: 'current' | 'muutoshakemus'): Promise<BudgetAmount> {
        const numberFieldSelector = type === 'current' ? '[class="existingAmount"] span' : '[class="changedAmount"][data-test-id="meno-input"]'
        const budgetRows = await page.$$eval('[data-test-class="existing-muutoshakemus"][data-test-state="new"] [data-test-id="meno-input-row"]', (elements, inputSelector) => {
          return elements.map(elem => ({
            name: elem.getAttribute('data-test-type')?.replace('-costs-row', '') || '',
            amount: elem.querySelector(inputSelector)?.innerHTML || ''
          }))
        }, numberFieldSelector) as BudgetRow[]

        return budgetRowsToBudgetAmount(budgetRows)
      }

      it('budget from hakemus is displayed to hakija as current budget', async () => {
        expect(await getNewHakemusExistingBudget()).toMatchObject(budget.amount)
      })

      it('haetut muutokset budget is displayed to hakija', async () => {
        expect(await getNewHakemusMuutoshakemusBudget()).toMatchObject(muutoshakemus1Budget)
      })

      it('perustelut is displayed to hakija', async () => {
        const perustelut = await getElementInnerText(page, '[data-test-id="muutoshakemus-talousarvio-perustelu"]')
        expect(perustelut).toBe(muutoshakemus1Perustelut)
      })

      it('jatkoaika is displayed to hakija', async () => {
        const date = await page.$eval('[data-test-id="muutoshakemus-jatkoaika"]', e => e.textContent)
        expect(date).toBe(jatkoaika.jatkoaika.format('DD.MM.YYYY'))
      })

      describe('And muutoshakemus #1 has been approved', () => {
        beforeAll(async () => {
          await fillMuutoshakemusPaatosWithVakioperustelu(page, avustushakuID, hakemusID)
          await acceptMuutoshakemusAndSendPaatosToHakija(page)
        })

        describe('And muutoshakemus #2 has been submitted with budget changes', () => {
          const muutoshakemus2Budget = {...muutoshakemus1Budget, ...{ personnel: '302', other: '8998' }}
          const muutoshakemus2Perustelut = 'Fattan fossiilit taas sniiduili ja oon akuutis likviditettivajees, pydeeks vippaa vähän hilui'

          beforeAll(async () => {
            await navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges(page, avustushakuID, hakemusID, jatkoaika, muutoshakemus2Budget, muutoshakemus2Perustelut)
          })

          it('accepted budget changes from muutoshakemus #1 are displayed as current budget', async () => {
            expect(await getNewHakemusExistingBudget()).toMatchObject(muutoshakemus1Budget)
          })

          it('haetut muutokset budget is displayed to hakija', async () => {
            expect(await getNewHakemusMuutoshakemusBudget()).toMatchObject(muutoshakemus2Budget)
          })

          it('perustelut is displayed to hakija', async () => {
            const perustelut = await getElementInnerText(page, '[data-test-class="existing-muutoshakemus"][data-test-state="new"] [data-test-id="muutoshakemus-talousarvio-perustelu"]')
            expect(perustelut).toBe(muutoshakemus2Perustelut)
          })

          it('two muutoshakemuses are visible to hakija', async () => {
            expect(await countElements(page, '[class="muutoshakemus_talousarvio"]')).toBe(2)
          })

          it('muutoshakemus #2 is in read-only state', async () => {
            const budgetInput = await page.$$('[data-test-type="personnel-costs-row"] input')
            expect(budgetInput).toEqual([])
          })
        })
      })
    })
  })


  describe.skip("Hakija haluaa tehdä muutoshakemuksen talouden käyttösuunnitelmaan", () => {
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

    describe('avaa esikatselun, kun "muutoshakemus hyväksytty" on valittuna', async () => {
      const previewContentSelector = '.muutoshakemus-paatos__content'

      beforeAll(async () => {
        await clickElement(page, 'a.muutoshakemus__paatos-preview-link')
        await page.waitForSelector(previewContentSelector)
      })

      afterAll(async () => {
        await clickElement(page, '.hakemus-details-modal__close-button')
      })

      it('näkee esikatselussa vanhan talousarvion', async () => {
        const budgetRowSelector = '.muutoshakemus-paatos__content [data-test-id=meno-input-row]'
        const budgetExpectedItems = [
          { description: 'Henkilöstömenot', amount: '200000 €' },
          { description: 'Aineet, tarvikkeet ja tavarat', amount: '3000 €' },
          { description: 'Laitehankinnat', amount: '10000 €' },
          { description: 'Palvelut', amount: '100 €' },
          { description: 'Vuokrat', amount: '161616 €' },
          { description: 'Matkamenot', amount: '100 €' },
          { description: 'Muut menot', amount: '10000000 €' }
        ]

        const budgetRows = await page.$$eval(budgetRowSelector, elements => {
          return elements.map(elem => ({
            description: elem.querySelector('.description')?.textContent,
            amount: elem.querySelector('.existingAmount')?.textContent
          }))
        })
        expect(budgetRows).toEqual(budgetExpectedItems)
      })

      it('näkee esikatselussa hyväksytyn talousarvion', async () => {
        const budgetRowSelector = '.muutoshakemus-paatos__content [data-test-id=meno-input-row]'
        const budgetExpectedItems = [
          { description: 'Henkilöstömenot', amount: '200100' },
          { description: 'Aineet, tarvikkeet ja tavarat', amount: '4001' },
          { description: 'Laitehankinnat', amount: '8999' },
          { description: 'Palvelut', amount: '100' },
          { description: 'Vuokrat', amount: '161616' },
          { description: 'Matkamenot', amount: '0' },
          { description: 'Muut menot', amount: '10000000' }
        ]

        const budgetRows = await page.$$eval(budgetRowSelector, elements => {
          return elements.map(elem => ({
            description: elem.querySelector('.description')?.textContent,
            amount: elem.querySelector('.changedAmount')?.textContent
          }))
        })
        expect(budgetRows).toEqual(budgetExpectedItems)
      })
    })
  })
})
