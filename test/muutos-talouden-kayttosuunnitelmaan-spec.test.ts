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
  selectVakioperusteluInFinnish,
  clickElement,
  getElementInnerText,
  clearAndType,
  hasElementAttribute,
  countElements,
  navigate,
  Budget,
  BudgetAmount,
  defaultBudget,
  createRandomHakuValues,
  clickElementWithText,
} from './test-util'
import {
  fillAndSendMuutoshakemusDecision,
  fillMuutoshakemusBudgetAmount,
  navigateToLatestMuutoshakemus,
  navigateToLatestMuutoshakemusPaatos,
  navigateToNthMuutoshakemus,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuWithLumpSumBudget,
} from './muutospaatosprosessi-util'
import {
  navigateToHakijaMuutoshakemusPage,
  navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges,
} from './muutoshakemus/muutoshakemus-util'
import { openPaatosPreview } from './hakemuksen-arviointi-util'

jest.setTimeout(400_000)

type TalousarvioFormInputs = Array<{ name: string, amount: number }>
type TalousarvioFormTable = Array<{ description: string, amount: string }>

export const answers = {
  contactPersonEmail: "erkki.esimerkki@example.com",
  contactPersonName: "Erkki Esimerkki",
  contactPersonPhoneNumber: "666",
  projectName: "Rahassa kylpijät Ky Ay Oy",
}

export const budget: Budget = {
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

  const sortedInputFields = (budgetList: TalousarvioFormInputs) => {
    return [...budgetList].sort((a, b) => a.name < b.name ? 1 : -1)
  }

  async function validateBudgetInputFields(expectedBudget: TalousarvioFormInputs) {
    const budgetRows = await page.$$eval('[data-test-id=talousarvio-form] [data-test-id=meno-input]', elements => {
      return elements.map(elem => ({
        name: elem.querySelector('input')?.getAttribute('name') || '',
        amount: parseInt(elem.querySelector('input')?.getAttribute('value') || '')
      }))
    })
    expect(sortedInputFields(budgetRows)).toEqual(sortedInputFields(expectedBudget))
  }

  const sortedFormTable = (budgetList: TalousarvioFormTable) => {
    return [...budgetList].sort((a, b) => a.description < b.description ? 1 : -1)
  }

  async function validateExistingBudgetTableCells(budgetRowSelector: string, expectedBudget: TalousarvioFormTable) {
    await page.waitForSelector(budgetRowSelector)
    const budgetRows = await page.$$eval(budgetRowSelector, elements => {
      return elements.map(elem => ({
        description: elem.querySelector('.description')?.textContent || '',
        amount: elem.querySelector(`.existingAmount`)?.textContent || ''
      }))
    })
    expect(sortedFormTable(budgetRows)).toEqual(sortedFormTable(expectedBudget))
  }

  async function validateChangedBudgetTableCells(budgetRowSelector: string, expectedBudget: TalousarvioFormTable) {
    await page.waitForSelector(budgetRowSelector)
    const budgetRows = await page.$$eval(budgetRowSelector, elements => {
      return elements.map(elem => ({
        description: elem.querySelector('.description')?.textContent || '',
        amount: elem.querySelector(`.changedAmount`)?.textContent || ''
      }))
    })
    expect(sortedFormTable(budgetRows)).toEqual(sortedFormTable(expectedBudget))
  }

  describe("When virkailija accepts hakemus without menoluokat", () => {
    let avustushakuID: number
    let hakemusID: number
    let emails: Email[]
    const haku = createRandomHakuValues()

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushakuWithLumpSumBudget(page, haku, answers, budget)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
      emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
    })

    it('päätös email contains a link to muutoshakemus', async () => {
      emails.forEach(email => {
        expect(email.formatted).toContain(`${HAKIJA_URL}/muutoshakemus`)
      })
    })

    it('muutoshakemus page does not allow hakija to change menoluokat', async () => {
      await navigateToHakijaMuutoshakemusPage(page, hakemusID)
      await page.waitForSelector('#checkbox-haenKayttoajanPidennysta', {
        visible: true,
      })
      await page.waitForSelector('#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan', {
        hidden: true,
      })
    })

    it('seuranta tab shows the accepted lump sum', async () => {
      await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID)
      await clickElement(page, '[data-test-id=tab-seuranta]')
      const grantedTotal = await getElementInnerText(page, '[data-test-id=granted-total]')
      expect(grantedTotal).toEqual("100000")
      const amountTotal = await getElementInnerText(page, '[data-test-id=amount-total]')
      expect(amountTotal).toEqual("100000")
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
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(page, haku, answers, budget)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
    })

    describe('And muutoshakemus #1 has been submitted with jatkoaika and budget changes', () => {
      const muutoshakemus1Budget: BudgetAmount = {
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
        await navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges(page, hakemusID, jatkoaika, muutoshakemus1Budget, muutoshakemus1Perustelut)
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
            amount: elem.querySelector(inputSelector as string)?.innerHTML || ''
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

      it('perustelut title is displayed to hakija', async () => {
        const perustelut = await getElementInnerText(page, '[data-test-id="reasoning-title"')
        expect(perustelut).toBe('Hakijan perustelut')
      })

      it('Current budged title is displayed to hakija', async () => {
        const perustelut = await getElementInnerText(page, '.currentBudget')
        expect(perustelut).toBe('Voimassaoleva budjetti')
      })

      it('Current budged title is displayed to hakija', async () => {
        const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change-title"]')
        expect(currentBudgetHeader).toEqual('Haettu uusi budjetti')
      })

      it('perustelut is displayed to hakija', async () => {
        const perustelut = await getElementInnerText(page, '[data-test-id="muutoshakemus-talousarvio-perustelu"]')
        expect(perustelut).toBe(muutoshakemus1Perustelut)
      })

      it('jatkoaika is displayed to hakija', async () => {
        const date = await page.$eval('[data-test-id="muutoshakemus-jatkoaika"]', e => e.textContent)
        expect(date).toBe(jatkoaika.jatkoaika.format('DD.MM.YYYY'))
      })

      it('virkailija seuranta tab shows the granted budget as accepted by OPH', async () => {
        await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID)
        await clickElement(page, '[data-test-id=tab-seuranta]')
        await Promise.all(Object.keys(budget.description).map(async (k: string) => {
          const budgetAmount = budget.amount[k as keyof BudgetAmount]
          const granted = await getElementInnerText(page, `[data-test-id=${k}-costs-row] td.granted-amount-column`)
          expect(granted).toEqual(budgetAmount)
          const amount = await getElementInnerText(page, `[data-test-id=${k}-costs-row] td.amount-column`)
          expect(amount).toEqual(budgetAmount)
        }))
        const grantedTotal = await getElementInnerText(page, '[data-test-id=granted-total]')
        expect(grantedTotal).toEqual("5329134")
        const amountTotal = await getElementInnerText(page, '[data-test-id=amount-total]')
        expect(amountTotal).toEqual("5329134")
      })

      describe('And muutoshakemus #1 has been accepted with changes', () => {
        const acceptedBudget: BudgetAmount = {
          personnel: '1301',
          material: '1421',
          equipment: '2338',
          'service-purchase': '5312007',
          rent: '1068',
          steamship: '1000',
          other: '9999',
        }

        beforeAll(async () => {
          await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
          await clickElement(page, 'span.muutoshakemus-tab')
          await fillAndSendMuutoshakemusDecision(page, 'accepted_with_changes', '01.01.2099', acceptedBudget)
        })

        it('newest approved budget is prefilled on the new muutoshakemus form', async () => {
          await navigateToHakijaMuutoshakemusPage(page, hakemusID)
          await clickElement(page, '#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan')
          const expectedBudgetInputs = [
            { name: 'talousarvio.personnel-costs-row', amount: 1301 },
            { name: 'talousarvio.material-costs-row', amount: 1421 },
            { name: 'talousarvio.equipment-costs-row', amount: 2338 },
            { name: 'talousarvio.service-purchase-costs-row', amount: 5312007 },
            { name: 'talousarvio.rent-costs-row', amount: 1068 },
            { name: 'talousarvio.steamship-costs-row', amount: 1000 },
            { name: 'talousarvio.other-costs-row', amount: 9999 }
          ]
          await validateBudgetInputFields(expectedBudgetInputs)
        })

        it('virkailija seuranta tab shows the accepted muutoshakemus budget as accepted by OPH', async () => {
          await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID)
          await clickElement(page, '[data-test-id=tab-seuranta]')
          await Promise.all(Object.keys(budget.description).map(async (k: string) => {
            const grantedSelector = `[data-test-id=${k}-costs-row] td.granted-amount-column`
            const granted = await getElementInnerText(page, grantedSelector)
            expect(granted).toEqual(budget.amount[k as keyof BudgetAmount])
            const amount = await getElementInnerText(page, `[data-test-id=${k}-costs-row] td.amount-column`)
            expect(amount).toEqual(acceptedBudget[k as keyof BudgetAmount])
          }))
          const grantedTotal = await getElementInnerText(page, '[data-test-id=granted-total]')
          expect(grantedTotal).toEqual("5329134")
          const amountTotal = await getElementInnerText(page, '[data-test-id=amount-total]')
          expect(amountTotal).toEqual("5329134")
        })

        describe('And hakija navigates to muutoshakemus page', () => {
          beforeAll(async () => {
            await navigateToHakijaMuutoshakemusPage(page, hakemusID)
          })

          it('Muutoshakemus title states that it has been approved with changes', async () => {
            const text = await getElementInnerText(page, '[data-test-id="paatos-status-text"')
            expect(text).toBe('Hyväksytty muutettuna')
          })

          it('budget is shown as a decision instead of a muutoshakemus', async () => {
            const currentBudgetHeader = await getElementInnerText(page, '.currentBudget')
            expect(currentBudgetHeader).toEqual('Vanha budjetti')
          })

          it('budget is shown as approved', async () => {
            const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change-title"]')
            expect(currentBudgetHeader).toEqual('Hyväksytty uusi budjetti')
          })
        })

        describe('Hakija views the muutoshakemus päätös', () => {
          beforeAll(async () => {
            await navigateToLatestMuutoshakemusPaatos(page, hakemusID)
          })

          it('Decision title is shown in finnish', async () => {
            const title = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-title"]')
            expect(title).toEqual('PÄÄTÖS')
          })

          it('Asia title is shown in finnish', async () => {
            const title = await getElementInnerText(page, '[data-test-id="muutospaatos-asia-title"]')
            expect(title).toEqual('Asia')
          })

          it('Decision section title is shown in finnish', async () => {
            const title = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-section-title"]')
            expect(title).toEqual('Päätös')
          })

          it('Decision is shown in finnish', async () => {
            const title = await getElementInnerText(page, '[data-test-id="paatos-paatos"]')
            expect(title).toEqual('Opetushallitus on hyväksynyt haetut muutokset tässä päätöksessä kuvatuin muutoksin.')
          })

          it('Accepted changes title is shown in finnish', async () => {
            const title = await getElementInnerText(page, '[data-test-id="accepted-changes-title"]')
            expect(title).toEqual('Hyväksytyt muutokset')
          })

          it('Current budget title is shown in finnish', async () => {
            const currentBudgetHeader = await getElementInnerText(page, '.currentBudget')
            expect(currentBudgetHeader).toEqual('Vanha budjetti')
          })

          it('Approved budget title is shown in finnish', async () => {
            const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change-title"]')
            expect(currentBudgetHeader).toEqual('Hyväksytty uusi budjetti')
          })

          it('Asia is shown in finnish', async () => {
            const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change"]')
            expect(currentBudgetHeader).toEqual('Muutoshakemus talouden käyttösuunnitelmaan.')
          })

          it('Päätöksen perustelut is shown in finnish', async () => {
            const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-perustelut-title"]')
            expect(currentBudgetHeader).toEqual('Päätöksen perustelut')
          })

          it('Päätöksen tekijä is shown in finnish', async () => {
            const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-tekija-title"]')
            expect(currentBudgetHeader).toEqual('Hyväksyjä')
          })

          it('Lisätietoja title is shown in finnish', async () => {
            const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-lisatietoja-title"]')
            expect(currentBudgetHeader).toEqual('Lisätietoja')
          })

          it('budget change is mentioned in the info section', async () => {
            const budgetChangeText = await getElementInnerText(page, '[data-test-id="budget-change"]')
            expect(budgetChangeText).toEqual('Muutoshakemus talouden käyttösuunnitelmaan.')
          })

          it('the old budget is shown on the päätös', async () => {
            const budgetRowSelector = '.muutoshakemus-paatos__content [data-test-id=meno-input-row]'
            const budgetExpectedItems = [
              { description: 'Henkilöstömenot', amount: '300 €' },
              { description: 'Aineet, tarvikkeet ja tavarat', amount: '420 €' },
              { description: 'Laitehankinnat', amount: '1337 €' },
              { description: 'Palvelut', amount: '5318008 €' },
              { description: 'Vuokrat', amount: '69 €' },
              { description: 'Matkamenot', amount: '0 €' },
              { description: 'Muut menot', amount: '9000 €' }
            ]
            await validateExistingBudgetTableCells(budgetRowSelector, budgetExpectedItems)
          })

          it('the "accepted with changes" budget is shown on the päätös', async () => {
            const budgetRowSelector = '.muutoshakemus-paatos__content [data-test-id=meno-input-row]'
            const budgetExpectedItems = [
              { description: 'Henkilöstömenot', amount: '1301' },
              { description: 'Aineet, tarvikkeet ja tavarat', amount: '1421' },
              { description: 'Laitehankinnat', amount: '2338' },
              { description: 'Palvelut', amount: '5312007' },
              { description: 'Vuokrat', amount: '1068' },
              { description: 'Matkamenot', amount: '1000' },
              { description: 'Muut menot', amount: '9999' }
            ]
            await validateChangedBudgetTableCells(budgetRowSelector, budgetExpectedItems)
          })
        })

        describe('And muutoshakemus #2 has been submitted with budget changes', () => {
          const muutoshakemus2Budget = {...muutoshakemus1Budget, ...{ personnel: '302', other: '8998' }}
          const muutoshakemus2Perustelut = 'Fattan fossiilit taas sniiduili ja oon akuutis likviditettivajees, pydeeks vippaa vähän hilui'

          beforeAll(async () => {
            await navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges(page, hakemusID, jatkoaika, muutoshakemus2Budget, muutoshakemus2Perustelut)
          })

          it('accepted budget changes from muutoshakemus #1 are displayed as current budget', async () => {
            expect(await getNewHakemusExistingBudget()).toMatchObject(acceptedBudget)
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
              expect(currentBudgetHeader).toEqual('Vanha budjetti')
            })

            it('budget is shown as approved', async () => {
              const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change-title"]')
              expect(currentBudgetHeader).toEqual('Hyväksytty uusi budjetti')
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

            it('Current budget is shown as muutoshakemus', async () => {
              const currentBudgetHeader = await getElementInnerText(page, '.currentBudget')
              expect(currentBudgetHeader).toEqual('Voimassaoleva budjetti')
            })

            it('Applied budget is shown as muutoshakemus', async () => {
              const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change-title"]')
              expect(currentBudgetHeader).toEqual('Haettu uusi budjetti')
            })
          })

          describe('And muutoshakemus #2 has been rejected', () => {
            beforeAll(async () => {
              await navigateToNthMuutoshakemus(page, avustushakuID, hakemusID, 2)
              await selectVakioperusteluInFinnish(page)
              await fillAndSendMuutoshakemusDecision(page, 'rejected')
            })

            it('budget is shown as a muutoshakemus instead of a decision', async () => {
              const currentBudgetHeader = await getElementInnerText(page, '.currentBudget')
              expect(currentBudgetHeader).toEqual('Voimassaoleva budjetti')
              const existingAmount = await page.waitForSelector('[data-test-type="personnel-costs-row"] [class="existingAmount"] span', { visible: true })
              const textDecoration = await page.evaluate(e => getComputedStyle(e).textDecorationLine, existingAmount)
              expect(textDecoration).toBe('line-through')
            })

            it('prefilled budget for next muutoshakemus is still the one accepted for muutoshakemus #1', async () => {
              await navigateToHakijaMuutoshakemusPage(page, hakemusID)
              await clickElement(page, '#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan')
              const expectedBudgetInputs = [
                { name: 'talousarvio.personnel-costs-row', amount: 1301 },
                { name: 'talousarvio.material-costs-row', amount: 1421 },
                { name: 'talousarvio.equipment-costs-row', amount: 2338 },
                { name: 'talousarvio.service-purchase-costs-row', amount: 5312007 },
                { name: 'talousarvio.rent-costs-row', amount: 1068 },
                { name: 'talousarvio.steamship-costs-row', amount: 1000 },
                { name: 'talousarvio.other-costs-row', amount: 9999 }
              ]
              await validateBudgetInputFields(expectedBudgetInputs)
            })
          })
        })
      })
    })
  })

  describe("Hakija haluaa tehdä muutoshakemuksen talouden käyttösuunnitelmaan", () => {
    let hakemusID: number
    const haku = createRandomHakuValues()

    beforeAll(async () => {
      const { hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(page, haku, answers, defaultBudget)
      hakemusID = hakemusId
      await navigateToHakijaMuutoshakemusPage(page, hakemusID)
      await clickElement(page, '#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan')
    })

    it('ja oppia mahdollisuudesta tehdä muutoksia talouden käyttösuunnitelmaa hakemuksen päätöksen s.postista', async () => {
      const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
      emails.forEach(email => {
        const emailContent = email.formatted
        expect(emailContent).toContain('Pääsette tekemään muutoshakemuksen sekä muuttamaan yhteyshenkilöä ja hänen yhteystietojaan koko hankekauden ajan tästä linkistä')
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


  describe("Virkailija handles a budget change", () => {
    let avustushakuID: number
    let hakemusID: number
    const haku = createRandomHakuValues()

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(page, haku, answers, defaultBudget)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
      await navigateToHakijaMuutoshakemusPage(page, hakemusID)
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

    it('sees the current budget', async () => {
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

    it('sees the proposed budget change', async () => {
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

    it('sees the reasoning for the proposed budget change', async () => {
      const budgetReason = '[data-test-id="muutoshakemus-talousarvio-perustelu"]'
      await page.waitForSelector(budgetReason)
      const perustelu = await getElementInnerText(page, budgetReason)
      expect(perustelu).toEqual('perustelu')
    })

    describe('opens the paatos preview when "accepted with changes" is chosen', () => {
      const budget: BudgetAmount = {
        personnel: '200000',
        material: '3001',
        equipment: '9999',
        'service-purchase': '1100',
        rent: '160616',
        steamship: '100',
        other: '10000000',
      }

      beforeAll(async () => {
        await clickElement(page, 'label[for=accepted_with_changes]')
        await fillMuutoshakemusBudgetAmount(page, budget)
        await openPaatosPreview(page)
      })

      afterAll(async () => {
        await clickElementWithText(page, 'button', 'Sulje')
      })

      it('sees the old budget in the preview', async () => {
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

      it('sees the changed budget in the preview', async () => {
        const budgetRowSelector = '.muutoshakemus-paatos__content [data-test-id=meno-input-row]'
        const budgetExpectedItems = [
          { description: 'Henkilöstömenot', amount: '200000' },
          { description: 'Aineet, tarvikkeet ja tavarat', amount: '3001' },
          { description: 'Laitehankinnat', amount: '9999' },
          { description: 'Palvelut', amount: '1100' },
          { description: 'Vuokrat', amount: '160616' },
          { description: 'Matkamenot', amount: '100' },
          { description: 'Muut menot', amount: '10000000' }
        ]
        await validateChangedBudgetTableCells(budgetRowSelector, budgetExpectedItems)
      })
    })

    describe('opens the paatos preview when "accepted" is chosen', () => {
      beforeAll(async () => {
        await clickElement(page, 'label[for=accepted]')
        await openPaatosPreview(page)
      })

      afterAll(async () => {
        await clickElementWithText(page, 'button', 'Sulje')
      })

      it('sees the old budget in the preview', async () => {
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

      it('sees the proposed budget in the preview', async () => {
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

    describe('opens the paatos preview when "rejected" is chosen', () => {
      beforeAll(async () => {
        await clickElement(page, 'label[for=rejected]')
        await openPaatosPreview(page)
      })

      afterAll(async () => {
        await clickElementWithText(page, 'button', 'Sulje')
      })

      it('does not see a budget table in the preview', async () => {
        const talousarvioElems = await countElements(page, '.muutoshakemus-paatos__content .muutoshakemus_talousarvio')
        expect(talousarvioElems).toEqual(0)
      })
    })

    describe('accepts the muutoshakemus', () => {
      beforeAll(async () => {
        await clickElement(page, 'label[for=accepted]')
        await selectVakioperusteluInFinnish(page)
        await clickElement(page, '[data-test-id="muutoshakemus-submit"]')
        await page.waitForSelector('[data-test-id="muutoshakemus-paatos"]')
      })

      it('sees the old budget on the accepted muutoshakemus', async () => {
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

      it('sees the accepted budget on the accepted muutoshakemus', async () => {
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

      it('sees the reasoning for the budget change on the accepted muutoshakemus', async () => {
        const budgetReason = '[data-test-id="muutoshakemus-talousarvio-perustelu"]'
        await page.waitForSelector(budgetReason)
        const perustelu = await getElementInnerText(page, budgetReason)
        expect(perustelu).toEqual('perustelu')
      })

      describe('Hakija views the muutoshakemus päätös', () => {
        beforeAll(async () => {
          await navigateToLatestMuutoshakemusPaatos(page, hakemusID)
        })

        it('budget change is mentioned in the info section', async () => {
          const budgetChangeText = await getElementInnerText(page, '[data-test-id="budget-change"]')
          expect(budgetChangeText).toEqual('Muutoshakemus talouden käyttösuunnitelmaan.')
        })

        it('the old budget is shown on the päätös', async () => {
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

        it('the accepted budget is shown on the päätös', async () => {
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
    })
  })
})
