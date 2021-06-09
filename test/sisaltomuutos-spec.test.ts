import { Browser, Page } from 'puppeteer'

import {
  mkBrowser,
  log,
  getFirstPage,
  setPageErrorConsoleLogger,
  clickElement,
  Budget,
  createRandomHakuValues,
  getElementInnerText,
  textContent,
  selectVakioperusteluInFinnish,
} from './test-util'
import {
  navigateToLatestMuutoshakemus,
  navigateToLatestMuutoshakemusPaatos,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
} from './muutospaatosprosessi-util'
import {
  navigateToHakijaMuutoshakemusPage,
  fillSisaltomuutosPerustelut,
  clickSendMuutoshakemusButton,
  expectMuutoshakemusToBeSubmittedSuccessfully
} from './muutoshakemus/muutoshakemus-util'
import { closePaatosPreview, openPaatosPreview } from './hakemuksen-arviointi-util'

jest.setTimeout(400_000)

export const answers = {
  contactPersonEmail: "erkki.esimerkki@example.com",
  contactPersonName: "Erkki Esimerkki",
  contactPersonPhoneNumber: "666",
  projectName: "Rahassa kylpijät Ky Ay Oy",
}

describe('Sisaltomuutos', () => {
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

  describe('Approved sisältömuutos', () => {
    describe('Sending muutoshakemus', () => {
      beforeAll(async () => {
        await navigateToHakijaMuutoshakemusPage(page, hakemusID)
        await clickElement(page, '#checkbox-haenSisaltomuutosta')
        await fillSisaltomuutosPerustelut(page, sisaltomuutosPerustelut)
        await clickSendMuutoshakemusButton(page)
      })

      it('Shows that the muutoshakemus was submitted successfully', async () => {
        await expectMuutoshakemusToBeSubmittedSuccessfully(page, true)
      })

      it('Shows the sisältömuutos in the existing muutoshakemus', async () => {
        const sisaltomuutos = await getElementInnerText(page, '[data-test-class="existing-muutoshakemus"] [data-test-id="sisaltomuutos-perustelut"]')
        expect(sisaltomuutos).toEqual(sisaltomuutosPerustelut)
      })
    })

    describe('Handling muutoshakemus', () => {
      beforeAll(async () => {
        await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID)
      })

      it('Virkailija sees the sisältömuutos', async () => {
        const sisaltomuutos = await getElementInnerText(page, '[data-test-id="sisaltomuutos-perustelut"]')
        expect(sisaltomuutos).toEqual(sisaltomuutosPerustelut)
      })

      describe('preview for virkailija', () => {
        beforeAll(async () => {
          await openPaatosPreview(page)
        })

        it('should include sisältömuutos in asia section', async () => {
          const asiaSectionContent = await textContent(page, '[data-test-id=muutospaatos-asia-content]')
          expect(asiaSectionContent).toContain('Muutoshakemus hankesuunnitelman sisältöön tai toteutustapaan')
        })

        afterAll(async () => {
          await closePaatosPreview(page)
        })
      })

      describe('sending decision', () => {
        beforeAll(async () => {
          await selectVakioperusteluInFinnish(page)
          await clickElement(page, '[data-test-id="muutoshakemus-submit"]')
          await page.waitForSelector('[data-test-id="muutoshakemus-paatos"]')
        })

        it('shows the original application text', async () => {
          const sentApplicationInformation = await textContent(page, '[data-test-id="sisaltomuutos-perustelut"]')
          expect(sentApplicationInformation).toContain(sisaltomuutosPerustelut)
        })
      })
    })

    describe('Viewing päätös for hakija', () => {
      beforeAll(async () => {
        await navigateToLatestMuutoshakemusPaatos(page, hakemusID)
      })

      it('should include sisältömuutos in asia section', async () => {
        const asiaSectionContent = await textContent(page, '[data-test-id=muutospaatos-asia-content]')
        expect(asiaSectionContent).toContain('Muutoshakemus hankesuunnitelman sisältöön tai toteutustapaan')
      })
    })
  })
})

