import { Browser, Page } from 'puppeteer'

import {
  mkBrowser,
  log,
  getFirstPage,
  clickElementWithText,
  setPageErrorConsoleLogger,
  clickElement,
  VIRKAILIJA_URL,
  Budget,
  createRandomHakuValues,
  getElementInnerText,
  selectVakioperusteluInFinnish,
  clearAndType,
  navigate,
  selectValmistelijaForHakemus
} from '../../test-util'
import {
  navigateToLatestMuutoshakemus,
  navigateToLatestMuutoshakemusPaatos,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
} from '../muutospaatosprosessi-util'
import {
  navigateToHakijaMuutoshakemusPage,
  fillSisaltomuutosPerustelut,
  clickSendMuutoshakemusButton,
  expectMuutoshakemusToBeSubmittedSuccessfully
} from '../muutoshakemus-util'
import { closePaatosPreview, openPaatosPreview } from '../../hakemuksen-arviointi/hakemuksen-arviointi-util'

jest.setTimeout(400_000)

export const answers = {
  contactPersonEmail: "erkki.esimerkki@example.com",
  contactPersonName: "Erkki Esimerkki",
  contactPersonPhoneNumber: "666",
  projectName: "Rahassa kylpijät Ky Ay Oy",
}

describe('Ukottamattoman valmistelijan (paallikon) hyvaksyessa muutoshakemuksen, hyvaksyjaksi tulee hyvaksyja, esittelijaksi ukotettu valmistelija ja lisatietoja osioon tulee ukotettu valmistelija', () => {
  let browser: Browser
  let page: Page

  let avustushakuID: number
  let hakemusID: number
  const haku = createRandomHakuValues('Sisältömuutos')
  const sisaltomuutosPerustelut = 'Muutamme kaiken muuttamisen ilosta'
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


  beforeEach(() => {
    log(`Starting test: ${expect.getState().currentTestName}`)
  })

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)

    const result = await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(page, haku, answers, budget)
    avustushakuID = result.avustushakuID
    hakemusID = result.hakemusID
  })

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  describe('add Matti as valmistelija for avustushaku', () => {
    beforeAll(async () => {
      await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
      await Promise.all([
        page.waitForResponse(`${VIRKAILIJA_URL}/api/va-user/search`),
        clearAndType(page, '#va-user-search-input', 'matti')
      ])
      await Promise.all([
        page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/role`),
        clickElementWithText(page, "a", "Ranta")
      ])
    })
    describe('ukota Matti for hakemus', () => {
      beforeAll(async () => {
        await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "Matti Ranta")
      })
      describe('remove current user from avustushaku valmistelijat', () => {
        beforeAll(async () => {
          await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
          await Promise.all([
            page.waitForResponse(
              response => {
                const regex = new RegExp(`.*api/avustushaku/${avustushakuID}/role/*`, "g")
                const matchResult = response.url().match(regex)
                return !!matchResult && matchResult.length > 0
                }),
            clickElement(page, '[data-test-id="remove-role-_-valtionavustus"]')
          ])
        })
        describe('Send muutoshakemus', () => {
          beforeAll(async () => {
            await navigateToHakijaMuutoshakemusPage(page, hakemusID)

            await clickElement(page, '#checkbox-haenSisaltomuutosta')
            await fillSisaltomuutosPerustelut(page, sisaltomuutosPerustelut)
            const sendButtonText = await getElementInnerText(page, '#send-muutospyynto-button')
            expect(sendButtonText).toEqual('Lähetä käsiteltäväksi')

            await clickSendMuutoshakemusButton(page)
            await expectMuutoshakemusToBeSubmittedSuccessfully(page, true)
          })
          describe('Handle muutoshakemus', () => {
            beforeAll(async () => {
              await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID)
            })

            describe('preview for virkailija', () => {
              beforeAll(async () => {
                await openPaatosPreview(page)
              })

              it('should have _ valtionavustus as hyväksyjä', async () => {
                const hyvaksyja = await getElementInnerText(page, '[data-test-id="paatos-decider"]')
                expect(hyvaksyja).toEqual("_ valtionavustus")
              })

              it('should have Matti Ranta as esittelijä', async () => {
                const esittelija = await getElementInnerText(page, '[data-test-id="paatos-esittelija"]')
                expect(esittelija).toEqual("Matti Ranta")
              })

              it('should have Matti Ranta in lisatietoja section', async () => {
                const lisatietoja = await getElementInnerText(page, '[data-test-id="paatos-additional-info"]')
                expect(lisatietoja).toContain("Matti Ranta")
              })

              afterAll(async () => {
                await closePaatosPreview(page)
              })
            })

            describe('send decision', () => {
              beforeAll(async () => {
                await writeSisältömuutosPäätös(page, 'Muutokset hankkeen sisältöön tai toteutustapaan hyväksytään  hakemuksen mukaisesti.')
                await selectVakioperusteluInFinnish(page)
                await clickElement(page, '[data-test-id="muutoshakemus-submit"]')
                await page.waitForSelector('[data-test-id="muutoshakemus-paatos"]')
              })
              describe('Viewing päätös for hakija', () => {
                beforeAll(async () => {
                  await navigateToLatestMuutoshakemusPaatos(page, hakemusID)
                })
                it('should have _ valtionavustus as hyväksyjä', async () => {
                  const hyvaksyja = await getElementInnerText(page, '[data-test-id="paatos-decider"]')
                  expect(hyvaksyja).toEqual("_ valtionavustus")
                })

                it('should have Matti Ranta as esittelijä', async () => {
                  const esittelija = await getElementInnerText(page, '[data-test-id="paatos-esittelija"]')
                  expect(esittelija).toEqual("Matti Ranta")
                })

                it('should have Matti Ranta in lisatietoja section', async () => {
                  const lisatietoja = await getElementInnerText(page, '[data-test-id="paatos-additional-info"]')
                  expect(lisatietoja).toContain("Matti Ranta")
                })
              })
            })
          })
        })
      })
    })
  })
})

async function writeSisältömuutosPäätös(page: Page, text: string) {
  await clearAndType(page, '[name=hyvaksytyt-sisaltomuutokset]', text)
}
