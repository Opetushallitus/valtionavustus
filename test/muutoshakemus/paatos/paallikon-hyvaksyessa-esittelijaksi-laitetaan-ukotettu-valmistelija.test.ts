import {Browser, Page} from 'puppeteer'
import axios from "axios"

import {
  Budget,
  clearAndType,
  clickElement,
  clickElementWithText,
  createRandomHakuValues,
  getElementInnerText,
  getFirstPage,
  log,
  mkBrowser,
  navigate,
  saveMuutoshakemus,
  selectVakioperusteluInFinnish,
  selectValmistelijaForHakemus,
  setPageErrorConsoleLogger,
  VIRKAILIJA_URL,
  HAKIJA_URL
} from '../../test-util'
import {
  navigateToLatestMuutoshakemus,
  navigateToLatestMuutoshakemusPaatos,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
} from '../muutospaatosprosessi-util'
import {
  clickSendMuutoshakemusButton,
  expectMuutoshakemusToBeSubmittedSuccessfully,
  fillSisaltomuutosPerustelut,
  navigateToHakijaMuutoshakemusPage
} from '../muutoshakemus-util'
import {
  closePaatosPreview,
  openPaatosPreview
} from '../../hakemuksen-arviointi/hakemuksen-arviointi-util'
import {UserInfo} from "../../../va-virkailija/web/va/types";

jest.setTimeout(400_000)

export const answers = {
  contactPersonEmail: "erkki.esimerkki@example.com",
  contactPersonName: "Erkki Esimerkki",
  contactPersonPhoneNumber: "666",
  projectName: "Rahassa kylpijät Ky Ay Oy",
}

async function populateUserCache(users: Omit<UserInfo, 'username'>[]) {
  await axios.post(`${VIRKAILIJA_URL}/api/test/user-cache`, users)
}

const users = [
  {
    "person-oid": "oid",
    "first-name": "Matti",
    surname: "Mattilainen",
    email: "email@email.com",
    lang: "fi",
    privileges: ["va-admin"]
  },
  {
    "person-oid": "oid2",
    "first-name": "_",
    surname: "valtionavustus",
    email: "email2@email.com",
    lang: "fi",
    privileges: ["va-admin"]
  }
]


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

    await populateUserCache(users)

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
        clearAndType(page, '#va-user-search-input', 'Matti')
      ])
      await Promise.all([
        page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/role`),
        clickElementWithText(page, "a", "Matti")
      ])
    })
    describe('ukota Matti for hakemus', () => {
      beforeAll(async () => {
        await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "Matti")
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

              it('should have Matti as esittelijä', async () => {
                const esittelija = await getElementInnerText(page, '[data-test-id="paatos-esittelija"]')
                expect(esittelija).toContain("Matti")
              })

              it('should have Matti in lisatietoja section', async () => {
                const lisatietoja = await getElementInnerText(page, '[data-test-id="paatos-additional-info"]')
                expect(lisatietoja).toContain("Matti")
              })

              afterAll(async () => {
                await closePaatosPreview(page)
              })
            })

            describe('send decision', () => {
              beforeAll(async () => {
                await writeSisältömuutosPäätös(page, 'Muutokset hankkeen sisältöön tai toteutustapaan hyväksytään  hakemuksen mukaisesti.')
                await selectVakioperusteluInFinnish(page)
                await saveMuutoshakemus(page)
              })
              describe('Viewing päätös for hakija', () => {
                beforeAll(async () => {
                  await navigateToLatestMuutoshakemusPaatos(page, hakemusID)
                })
                it('should have _ valtionavustus as hyväksyjä', async () => {
                  const hyvaksyja = await getElementInnerText(page, '[data-test-id="paatos-decider"]')
                  expect(hyvaksyja).toEqual("_ valtionavustus")
                })

                it('should have Matti as esittelijä', async () => {
                  const esittelija = await getElementInnerText(page, '[data-test-id="paatos-esittelija"]')
                  expect(esittelija).toContain("Matti")
                })

                it('should have Matti in lisatietoja section', async () => {
                  const lisatietoja = await getElementInnerText(page, '[data-test-id="paatos-additional-info"]')
                  expect(lisatietoja).toContain("Matti")
                })

                describe('Clicking link in asia section', () => {
                  beforeAll(async () => {
                    await Promise.all([
                      page.waitForNavigation(),
                      clickElement(page, '[data-test-id="link-to-muutoshakemus"]') 
                    ])
                  })
                  it('navigates user to muutoshakemus', async () => {
                    expect(page.url()).toMatch(new RegExp(`${HAKIJA_URL}/muutoshakemus\\?user-key=.*&avustushaku-id=${avustushakuID}&lang=fi`))
                  })
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
