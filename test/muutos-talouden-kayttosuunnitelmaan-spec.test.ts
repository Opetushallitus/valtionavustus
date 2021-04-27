import { Browser, Page } from 'puppeteer'
import moment from 'moment'

import {
  Email,
  mkBrowser,
  HAKIJA_URL,
  log,
  waitUntilMinEmails,
  getAcceptedPäätösEmails,
  getFirstPage,
  setPageErrorConsoleLogger,
  selectVakioperustelu,
  randomString,
  navigateToHakijaMuutoshakemusPage,
  ratkaiseBudjettimuutoshakemusEnabledAvustushaku,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
  clickElement,
  getElementInnerText,
  clearAndType,
  hasElementAttribute,
  fillMuutoshakemusPaatosWithVakioperustelu,
  navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges,
  submitMuutoshakemusDecision,
  countElements,
  navigate,
  navigateToNthMuutoshakemus,
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

type TalousarvioFormInputs = Array<{ name: string, amount: number }>
type TalousarvioFormTable = Array<{ description: string, amount: string }>

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

  async function validateBudgetInputFields(expectedBudget: TalousarvioFormInputs) {
    const budgetRows = await page.$$eval('[data-test-id=talousarvio-form] [data-test-id=meno-input]', elements => {
      return elements.map(elem => ({
        name: elem.querySelector('input')?.getAttribute('name'),
        amount: parseInt(elem.querySelector('input')?.getAttribute('value') || '')
      }))
    })
    expect(budgetRows).toEqual(expectedBudget)
  }

  async function validateExistingBudgetTableCells(budgetRowSelector: string, expectedBudget: TalousarvioFormTable) {
    await page.waitForSelector(budgetRowSelector)
    const budgetRows = await page.$$eval(budgetRowSelector, elements => {
      return elements.map(elem => ({
        description: elem.querySelector('.description')?.textContent,
        amount: elem.querySelector(`.existingAmount`)?.textContent
      }))
    })
    expect(budgetRows).toEqual(expectedBudget)
  }

  async function validateChangedBudgetTableCells(budgetRowSelector: string, expectedBudget: TalousarvioFormTable) {
    await page.waitForSelector(budgetRowSelector)
    const budgetRows = await page.$$eval(budgetRowSelector, elements => {
      return elements.map(elem => ({
        description: elem.querySelector('.description')?.textContent,
        amount: elem.querySelector(`.changedAmount`)?.textContent
      }))
    })
    expect(budgetRows).toEqual(expectedBudget)
  }

  describe("When virkailija accepts hakemus without menoluokat", () => {
    let avustushakuID: number
    let hakemusID: number
    let emails: Email[]
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
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(page, haku, answers, budget)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
      emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, avustushakuID, hakemusID)
    })

    it('päätös email does not mention possibility of changing talousvaatimukset', async () => {
      emails.forEach(email => {
        expect(email.formatted).toContain(`${HAKIJA_URL}/muutoshakemus`)
        expect(email.formatted).not.toContain(`Hakea muutosta hankkeen talouden käyttösuunnitelmaan`)
      })
    })

    it('muutoshakemus page does not allow hakija to change menoluokat', async () => {
      await navigateToHakijaMuutoshakemusPage(page, avustushakuID, hakemusID)
      await page.waitForSelector('#checkbox-haenKayttoajanPidennysta', {
          visible: true,
      })
      await page.waitForSelector('#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan', {
          visible: false,
      })
    })
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

      describe('And muutoshakemus #1 has been accepted with changes', () => {
        beforeAll(async () => {
          await fillMuutoshakemusPaatosWithVakioperustelu(page, avustushakuID, hakemusID)
          await submitMuutoshakemusDecision(page)
        })

        it('newest approved budget is prefilled on the new muutoshakemus form', async () => {
          await navigateToHakijaMuutoshakemusPage(page, avustushakuID, hakemusID)
          await clickElement(page, '#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan')
          const expectedBudgetInputs = [
            { name: 'talousarvio.personnel-costs-row', amount: 301 },
            { name: 'talousarvio.material-costs-row', amount: 421 },
            { name: 'talousarvio.equipment-costs-row', amount: 1338 },
            { name: 'talousarvio.service-purchase-costs-row', amount: 5318007 },
            { name: 'talousarvio.rent-costs-row', amount: 68 },
            { name: 'talousarvio.steamship-costs-row', amount: 0 },
            { name: 'talousarvio.other-costs-row', amount: 8999 }
          ]
          await validateBudgetInputFields(expectedBudgetInputs)
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

          describe('When virkailija views muutoshakemus #1', () => {
            beforeAll(async () => {
              await navigateToNthMuutoshakemus(page, avustushakuID, hakemusID, 1)
            })

            it('budget is shown as a decision instead of a muutoshakemus', async () => {
              const currentBudgetHeader = await getElementInnerText(page, '.currentBudget')
              expect(currentBudgetHeader).toEqual('Vanha talousarvio')
            })

            it('Budget changes are not displayed as linethrough', async () => {
              const existingAmount = await page.waitForSelector('[data-test-type="personnel-costs-row"] [class="existingAmount"] span', { visible: true })
              const textDecoration = await page.evaluate(e => getComputedStyle(e).textDecorationLine, existingAmount)
              expect(textDecoration).toBe('none')
            })
          })

          describe('When virkailija views unapproved muutoshakemus #2', () => {
            beforeAll(async () => {
              await navigateToNthMuutoshakemus(page, avustushakuID, hakemusID, 2)
            })

            it('Budget changes are displayed as linethrough', async () => {
              const existingAmount = await page.waitForSelector('[data-test-type="personnel-costs-row"] [class="existingAmount"] span', { visible: true })
              const textDecoration = await page.evaluate(e => getComputedStyle(e).textDecorationLine, existingAmount)
              expect(textDecoration).toBe('line-through')
            })
          })

          describe('And muutoshakemus #2 has been rejected', () => {
            beforeAll(async () => {
              await navigateToNthMuutoshakemus(page, avustushakuID, hakemusID, 2)
              await selectVakioperustelu(page)
              await submitMuutoshakemusDecision(page, 'rejected')
            })

            it('budget is shown as a muutoshakemus instead of a decision', async () => {
              const currentBudgetHeader = await getElementInnerText(page, '.currentBudget')
              expect(currentBudgetHeader).toEqual('Voimassaoleva talousarvio')
              const existingAmount = await page.waitForSelector('[data-test-type="personnel-costs-row"] [class="existingAmount"] span', { visible: true })
              const textDecoration = await page.evaluate(e => getComputedStyle(e).textDecorationLine, existingAmount)
              expect(textDecoration).toBe('line-through')
            })

            it('prefilled budget for next muutoshakemus is still the one accepted for muutoshakemus #1', async () => {
              await navigateToHakijaMuutoshakemusPage(page, avustushakuID, hakemusID)
              await clickElement(page, '#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan')
              const expectedBudgetInputs = [
                { name: 'talousarvio.personnel-costs-row', amount: 301 },
                { name: 'talousarvio.material-costs-row', amount: 421 },
                { name: 'talousarvio.equipment-costs-row', amount: 1338 },
                { name: 'talousarvio.service-purchase-costs-row', amount: 5318007 },
                { name: 'talousarvio.rent-costs-row', amount: 68 },
                { name: 'talousarvio.steamship-costs-row', amount: 0 },
                { name: 'talousarvio.other-costs-row', amount: 8999 }
              ]
              await validateBudgetInputFields(expectedBudgetInputs)
            })
          })
        })
      })
    })
  })

  describe("Hakija haluaa tehdä muutoshakemuksen talouden käyttösuunnitelmaan", () => {
    let avustushakuID: number
    let hakemusID: number
    const haku = createRandomHakuValues()

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushaku(page, haku, answers)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
      await navigateToHakijaMuutoshakemusPage(page, avustushakuID, hakemusID)
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
      await validateBudgetInputFields(expectedBudgetInputs)
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
    let avustushakuID: number
    let hakemusID: number
    const haku = createRandomHakuValues()

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushaku(page, haku, answers)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
      await navigateToHakijaMuutoshakemusPage(page, avustushakuID, hakemusID)
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
      await validateExistingBudgetTableCells(budgetRowSelector, budgetExpectedItems)
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
      await validateChangedBudgetTableCells(budgetRowSelector, budgetExpectedItems)
    })

    it('näkee talouden käyttösuunnitelman muutoksen perustelut', async () => {
      const budgetReason = '[data-test-id="muutoshakemus-talousarvio-perustelu"]'
      await page.waitForSelector(budgetReason)
      const perustelu = await getElementInnerText(page, budgetReason)
      expect(perustelu).toEqual('perustelu')
    })

    describe('avaa esikatselun, kun "muutoshakemus hyväksytty" on valittuna', () => {
      beforeAll(async () => {
        await clickElement(page, 'label[for=accepted]')
        await clickElement(page, 'a.muutoshakemus__paatos-preview-link')
        await page.waitForSelector('.muutoshakemus-paatos__content')
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
        await validateExistingBudgetTableCells(budgetRowSelector, budgetExpectedItems)
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
        await validateChangedBudgetTableCells(budgetRowSelector, budgetExpectedItems)
      })
    })

    describe('avaa esikatselun, kun "muutoshakemus hylätty" on valittuna', () => {
      beforeAll(async () => {
        await clickElement(page, 'label[for=rejected]')
        await clickElement(page, 'a.muutoshakemus__paatos-preview-link')
        await page.waitForSelector('.muutoshakemus-paatos__content')
      })

      afterAll(async () => {
        await clickElement(page, '.hakemus-details-modal__close-button')
      })

      it('ei näe esikatselussa talousarvioita', async () => {
        const talousarvioElems = await countElements(page, '.muutoshakemus-paatos__content .muutoshakemus_talousarvio')
        expect(talousarvioElems).toEqual(0)
      })
    })

    describe('hyväksyy muutoshakemuksen', () => {
      beforeAll(async () => {
        await clickElement(page, 'label[for=accepted]')
        await clickElement(page, 'a.muutoshakemus__default-reason-link')
        await clickElement(page, '[data-test-id="muutoshakemus-submit"]')
        await page.waitForSelector('[data-test-id="muutoshakemus-paatos"]')
      })

      it('näkee vanhan talouden käyttösuunnitelman', async () => {
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
        await validateExistingBudgetTableCells(budgetRowSelector, budgetExpectedItems)
      })

      it('näkee hyväksytyn talouden käyttösuunnitelman', async () => {
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
        await validateChangedBudgetTableCells(budgetRowSelector, budgetExpectedItems)
      })

      it('näkee talouden käyttösuunnitelman muutoksen perustelut', async () => {
        const budgetReason = '[data-test-id="muutoshakemus-talousarvio-perustelu"]'
        await page.waitForSelector(budgetReason)
        const perustelu = await getElementInnerText(page, budgetReason)
        expect(perustelu).toEqual('perustelu')
      })
    })
  })
})
