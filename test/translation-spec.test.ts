import { Browser, Page } from 'puppeteer'
import {
  BudgetAmount,
  clickElement,
  fillAndSendMuutoshakemusDecision,
  getElementInnerText,
  getFirstPage,
  log,
  mkBrowser,
  navigate,
  navigateToHakijaMuutoshakemusPage,
  navigateToLatestMuutoshakemusPaatos,
  navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
  setPageErrorConsoleLogger,
  createRandomHakuValues,
  navigateToPaatos,
  Budget,
  Answers,
  clearAndType
} from './test-util'

import moment from 'moment'

jest.setTimeout(400_000)

export const answers: Answers = {
  contactPersonEmail: "erik.eksampletten@example.com",
  contactPersonName: "Erik Eksampletten",
  contactPersonPhoneNumber: "555",
  projectName: "Badet pengaren i Ankdammen",
  lang: 'sv'
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
    personnel: 'tjänare',
    material: 'båterna',
    equipment: 'champagne visp',
    'service-purchase': 'servitörena',
    rent: 'villa',
    steamship: 'ånga',
    other: 'Kalle Anka',
  },
  selfFinancing: '1',
}

const swedishBudgetRowNames = [
  'Personalkostnader',
  'Material, utrustning och varor',
  'Anskaffning av utrustning',
  'Tjänster',
  'Hyror',
  'Resekostnader',
  'Övriga kostnader'
]

const sortFn = (a: any, b: any) => a - b

describe('Translations', () => {
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

  describe('When avustushaku has been created and swedish hakemus has been submitted and approved', () => {
    let avustushakuID: number
    let hakemusID: number
    const haku = createRandomHakuValues()

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(page, haku, answers, budget)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
    })

    describe('And hakija navigates to päätös', () => {
      beforeAll(async () => {
        await navigateToPaatos(page, hakemusID)
      })

      it('päätös header title is in swedish', async () => {
        const title = await getElementInnerText(page, '[data-test-id="paatos-header-title"]')
        expect(title).toContain('BESLUT')
      })

      it('päätös title is in swedish', async () => {
        const title = await getElementInnerText(page, '[data-test-id="paatos-title"]')
        expect(title).toBe('BESLUT')
      })

      it('päätös accepted title is in swedish', async () => {
        const title = await getElementInnerText(page, '[data-test-id="paatos-accepted-title"]')
        expect(title).toBe('Utbildningsstyrelsen har beslutat att bevilja statsunderstöd till projektet')
      })

      it('lisätietoja title is in swedish', async () => {
        const title = await getElementInnerText(page, '[data-test-id="lisatietoja-title"]')
        expect(title).toBe('MER INFORMATION')
      })
    })

    describe('And hakija navigates to muutoshakemus page', () => {
      beforeAll(async () => {
        await navigateToHakijaMuutoshakemusPage(page, hakemusID)
      })

      it('register number title is in swedish', async () => {
        const title = await getElementInnerText(page, '.muutoshakemus__register-number')
        expect(title).toContain('Ärendenummer')
      })

      it('contact person title is in swedish', async () => {
        const title = await getElementInnerText(page, 'label[for="muutoshakemus__contact-person"]')
        expect(title).toBe('Kontaktperson')
      })

      it('contact person email title is in swedish', async () => {
        const title = await getElementInnerText(page, 'label[for="muutoshakemus__email"]')
        expect(title).toBe('Kontaktpersonens e-postadress')
      })

      it('contact person number title is in swedish', async () => {
        const title = await getElementInnerText(page, 'label[for="muutoshakemus__phone"]')
        expect(title).toBe('Kontaktpersonens telefonnummer')
      })

      it('jatkoaika title is in swedish', async () => {
        const title = await getElementInnerText(page, 'label[for="checkbox-haenKayttoajanPidennysta"]')
        expect(title).toBe('Jag ansöker om förlängd användningstid för statsunderstödet')
      })

      it('budget change title is in swedish', async () => {
        const title = await getElementInnerText(page, 'label[for="checkbox-haenMuutostaTaloudenKayttosuunnitelmaan"]')
        expect(title).toBe('Jag ansöker om ändringar i projektets budget')
      })

      describe('When user clicks "Haen pidennystä avustuksen käyttöajalle"', () => {
        beforeAll(async () => {
          await clickElement(page, '#checkbox-haenKayttoajanPidennysta')
        })

        it('existing date title is in swedish', async () => {
          const title = await getElementInnerText(page, '[data-test-id="jatkoaika-title-existing"]')
          expect(title).toBe('NUVARANDE SISTA ANVÄNDNINGDAG')
        })

        it('new date title is in swedish', async () => {
          const title = await getElementInnerText(page, '[data-test-id="jatkoaika-title-new"]')
          expect(title).toBe('NY SISTA ANVÄNDNINGSDAG')
        })

        it('perustelut title is in swedish', async () => {
          const title = await getElementInnerText(page, 'label[for="perustelut-kayttoajanPidennysPerustelut"]')
          expect(title).toBe('Motivering')
        })

        it('error message is in swedish', async () => {
          const title = await getElementInnerText(page, '.muutoshakemus__perustelut .muutoshakemus__error-message')
          expect(title).toBe('Obligatorisk uppgift')
        })

        it('calendar component is in Swedish', async () => {
          const monthButtonSelector = '#rw_1_date_calendar_label'
          await clearAndType(page, '[name=haettuKayttoajanPaattymispaiva]', '13.06.2021')
          await clickElement(page, 'button[title="Select date"]')
          await page.waitForSelector(monthButtonSelector)
          const title = await getElementInnerText(page, monthButtonSelector)
          expect(title).toBe('juni 2021')
        })
      })

      describe('When user clicks "Haen muutosta hankkeen talouden käyttösuunnitelmaan"', () => {
        beforeAll(async () => {
          await clickElement(page, '#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan')
        })

        it('Current budget title is in swedish', async () => {
          const title = await getElementInnerText(page, '.currentBudget')
          expect(title).toBe('Nuvarande budget')
        })

        it('Modified new budget title is in swedish', async () => {
          const title = await getElementInnerText(page, '.modifiedBudget')
          expect(title).toBe('Ny budget')
        })

        it('Total sum title is in swedish', async () => {
          const title = await getElementInnerText(page, '[data-test-id="expenses-total-title"]')
          expect(title).toBe('Sammanlagt')
        })

        it('Reasoning title is in swedish', async () => {
          const title = await getElementInnerText(page, 'label[for="perustelut-taloudenKayttosuunnitelmanPerustelut"]')
          expect(title).toBe('Motivering')
        })

        it('Budget rows are in Swedish', async () => {
          const budgetRows = await page.$$eval('[data-test-id=meno-input-row]', elements => {
            return elements.map(elem => elem.querySelector('.description')?.textContent || '')
          })
          expect(budgetRows.sort(sortFn)).toEqual(swedishBudgetRowNames.sort(sortFn))
        })
      })

      describe('And hakija submits muutoshakemus #1 with jatkoaika and budget changes', () => {
        const muutoshakemus1Budget = {
          ...budget.amount,
          personnel: '299',
          material: '421',
        }

        const muutoshakemus1Perustelut = 'Ska få ta bort något akut .... koda något om något ois ta bort bit sit mo'

        const jatkoaika = {
          jatkoaika: moment(new Date()).add(1, 'days').locale('fi'),
          jatkoaikaPerustelu: 'Dubbel dubbel-laa'
        }

        beforeAll(async () => {
          await navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges(page, hakemusID, jatkoaika, muutoshakemus1Budget, muutoshakemus1Perustelut)
        })

        it('perustelut title is displayed to hakija in swedish', async () => {
          const perustelut = await getElementInnerText(page, '[data-test-id="reasoning-title"')
          expect(perustelut).toBe('Den sökandes motiveringar')
        })

        it('current budged title is displayed to hakija in swedish', async () => {
          const perustelut = await getElementInnerText(page, '.currentBudget')
          expect(perustelut).toBe('Nuvarande budget')
        })

        it('haetut muutokset title is displayed to hakija in swedish', async () => {
          const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change-title"]')
          expect(currentBudgetHeader).toEqual('Den ansökta nya budgeten')
        })

        describe('And virkailija navigates to muutoshakemus tab', () => {
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
          })

          it('current budget title is in finnish', async () => {
            const title = await getElementInnerText(page, '.currentBudget')
            expect(title).toBe('Voimassaoleva budjetti')
          })

          it('applied budget title is in finnish', async () => {
            const title = await getElementInnerText(page, '[data-test-id="budget-change-title"]')
            expect(title).toBe('Haettu uusi budjetti')
          })

          it('reasoning title is in finnish', async () => {
            const title = await getElementInnerText(page, '[data-test-id="muutoshakemus-reasoning-title"]')
            expect(title).toBe('Hakijan perustelut')
          })

          describe('And accepts muutoshakemus #1 changes', () => {
            beforeAll(async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
              await clickElement(page, 'span.muutoshakemus-tab')
              await fillAndSendMuutoshakemusDecision(page, 'accepted_with_changes', '01.01.2099', acceptedBudget)
            })

            describe('And hakija navigates to muutoshakemus page', () => {
              beforeAll(async () => {
                await navigateToHakijaMuutoshakemusPage(page, hakemusID)
              })

              it('Muutoshakemus title states in swedish that it has been approved with changes', async () => {
                const text = await getElementInnerText(page, '[data-test-id="paatos-status-text"')
                expect(text).toBe('Hyväksytty muutettuna')
              })

              it('old budget title is shown in swedish', async () => {
                const currentBudgetHeader = await getElementInnerText(page, '.currentBudget')
                expect(currentBudgetHeader).toEqual('Den tidigare budgeten')
              })

              it('new budget is shown as approved in swedish', async () => {
                const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change-title"]')
                expect(currentBudgetHeader).toEqual('Godkänd ny budget')
              })
            })

            describe('And hakija navigates to muutoshakemus päätös page', () => {
              beforeAll(async () => {
                await navigateToLatestMuutoshakemusPaatos(page, hakemusID)
              })

              it('Decision title is shown in swedish', async () => {
                const title = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-title"]')
                expect(title).toEqual('BESLUT')
              })

              it('Asia title is shown in swedish', async () => {
                const title = await getElementInnerText(page, '[data-test-id="muutospaatos-asia-title"]')
                expect(title).toEqual('Ärende')
              })

              it('Decision section title is shown in swedish', async () => {
                const title = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-section-title"]')
                expect(title).toEqual('Beslut')
              })

              it.skip('Decision is shown in swedish', async () => {
                const title = await getElementInnerText(page, '[data-test-id="paatos-paatos"]')
                expect(title).toEqual('Och samma på svenska! - translations have not been provided')
              })

              it('Accepted changes title is shown in swedish', async () => {
                const title = await getElementInnerText(page, '[data-test-id="accepted-changes-title"]')
                expect(title).toEqual('Godkända ändringar')
              })

              it('current budget title is shown in swedish', async () => {
                const currentBudgetHeader = await getElementInnerText(page, '.currentBudget')
                expect(currentBudgetHeader).toEqual('Den tidigare budgeten')
              })

              it('approved budget title is shown in swedish', async () => {
                const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change-title"]')
                expect(currentBudgetHeader).toEqual('Godkänd ny budget')
              })

              it.skip('asia is shown in swedish', async () => {
                const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="budget-change"]')
                expect(currentBudgetHeader).toEqual('Och samma på svenska! - translations have not been provided')
              })

              it('päätöksen perustelut is shown in swedish', async () => {
                const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-perustelut-title"]')
                expect(currentBudgetHeader).toEqual('Motiveringar för beslutet')
              })

              it('päätöksen tekijä is shown in swedish', async () => {
                const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-tekija-title"]')
                expect(currentBudgetHeader).toEqual('Har godkänts av')
              })

              it('lisätietoja title is shown in swedish', async () => {
                const currentBudgetHeader = await getElementInnerText(page, '[data-test-id="muutoshakemus-paatos-lisatietoja-title"]')
                expect(currentBudgetHeader).toEqual('Mer information')
              })

              it.skip('budget change is mentioned in the info section', async () => {
                const budgetChangeText = await getElementInnerText(page, '[data-test-id="budget-change"]')
                expect(budgetChangeText).toEqual('Och samma på svenska! - translations have not been provided')
              })

              it('Budget rows are in Swedish', async () => {
                const budgetRows = await page.$$eval('[data-test-id=meno-input-row]', elements => {
                  return elements.map(elem => elem.querySelector('.description')?.textContent || '')
                })
                expect(budgetRows.sort(sortFn)).toEqual(swedishBudgetRowNames.sort(sortFn))
              })
            })
          })
        })
      })
    })
  })
})
