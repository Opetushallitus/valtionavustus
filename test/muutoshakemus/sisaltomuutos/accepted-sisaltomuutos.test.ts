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
  clearAndType,
  saveMuutoshakemus,
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

describe('Sisaltomuutos (accepted)', () => {
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

  describe('Sending muutoshakemus', () => {
    beforeAll(async () => {
      await navigateToHakijaMuutoshakemusPage(page, hakemusID)
    })

    it('shows correct send button, successfully sent text, and existing muutoshakemus', async () => {
      await clickElement(page, '#checkbox-haenSisaltomuutosta')
      await fillSisaltomuutosPerustelut(page, sisaltomuutosPerustelut)
      const sendButtonText = await getElementInnerText(page, '#send-muutospyynto-button')
      expect(sendButtonText).toEqual('Lähetä käsiteltäväksi')

      await clickSendMuutoshakemusButton(page)
      await expectMuutoshakemusToBeSubmittedSuccessfully(page, true)

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
        await expectAsiaSectionToContainSisaltomuutos(page)
      })

      it('should include text about accepted sisältömuutos in Hyväksytyt muutokset section', async () => {
        await expectAcceptedSisaltomuutosInPaatos(page)
      })

      afterAll(async () => {
        await closePaatosPreview(page)
      })
    })

    describe('sending decision', () => {
      beforeAll(async () => {
        await writeSisältömuutosPäätös(page, 'Muutokset hankkeen sisältöön tai toteutustapaan hyväksytään  hakemuksen mukaisesti.')
        await selectVakioperusteluInFinnish(page)
        await saveMuutoshakemus(page)
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
      await expectAsiaSectionToContainSisaltomuutos(page)
    })

    it('should include text about accepted sisältömuutos in Hyväksytyt muutokset section', async () => {
      await expectAcceptedSisaltomuutosInPaatos(page)
    })
  })
})

async function expectAsiaSectionToContainSisaltomuutos(page: Page) {
  const asiaSectionContent = await textContent(page, '[data-test-id=muutospaatos-asia-content]')
  expect(asiaSectionContent).toContain('Muutoshakemus hankesuunnitelman sisältöön tai toteutustapaan')
}

async function expectAcceptedSisaltomuutosInPaatos(page: Page) {
  const asiaSectionContent = await textContent(page, '[data-test-id=accepted-changes-content]')
  expect(asiaSectionContent).toContain('Hyväksytyt muutokset hankkeen sisältöön tai toteutustapaan')
}

async function writeSisältömuutosPäätös(page: Page, text: string) {
  await clearAndType(page, '[name=hyvaksytyt-sisaltomuutokset]', text)
}
