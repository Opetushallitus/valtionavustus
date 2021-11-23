import {Browser, Page} from 'puppeteer'

import {
  Budget,
  clickElement,
  createRandomHakuValues,
  getElementInnerText,
  getFirstPage,
  log,
  mkBrowser,
  saveMuutoshakemus,
  setPageErrorConsoleLogger,
  textContent,
} from '../../test-util'
import {
  navigateToLatestMuutoshakemus,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
  setMuutoshakemusSisaltoDecision,
  writeSisältömuutosPäätös,
} from '../muutospaatosprosessi-util'
import {
  clickSendMuutoshakemusButton,
  expectMuutoshakemusToBeSubmittedSuccessfully,
  fillSisaltomuutosPerustelut,
  navigateToHakijaMuutoshakemusPage
} from '../muutoshakemus-util'

export const answers = {
  contactPersonEmail: "erkki.esimerkki@example.com",
  contactPersonName: "Erkki Esimerkki",
  contactPersonPhoneNumber: "666",
  projectName: "Rahassa kylpijät Ky Ay Oy",
}

const muutosButtonSelector = '[data-test-id="muutoshakemus-submit"]'

const muutosSendButtonDisabled = async (page: Page) =>
  await page.waitForSelector(`${muutosButtonSelector}:disabled`, {visible: true})

const muutosSendButtonEnabled = async (page: Page) =>
  await page.waitForSelector(`${muutosButtonSelector}:not([disabled])`, {visible: true})

jest.setTimeout(30000)

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
  }, 120000)

  const sendMuutoshakemusWithSisaltomuutos = async () => {
    await navigateToHakijaMuutoshakemusPage(page, hakemusID)
    await clickElement(page, '#checkbox-haenSisaltomuutosta')
    await fillSisaltomuutosPerustelut(page, sisaltomuutosPerustelut)
    const sendButtonText = await getElementInnerText(page, '#send-muutospyynto-button')
    expect(sendButtonText).toEqual('Lähetä käsiteltäväksi')

    await clickSendMuutoshakemusButton(page)
    await expectMuutoshakemusToBeSubmittedSuccessfully(page, true)

    const sisaltomuutos = await getElementInnerText(page, '[data-test-class="existing-muutoshakemus"] [data-test-id="sisaltomuutos-perustelut"]')
    expect(sisaltomuutos).toEqual(sisaltomuutosPerustelut)
  }

  beforeAll(sendMuutoshakemusWithSisaltomuutos, 60000)

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  describe('Handling muutoshakemus', () => {
    beforeAll(async () => {
      await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID)
    })

    it('Virkailija sees the sisältömuutos', async () => {
      const sisaltomuutos = await getElementInnerText(page, '[data-test-id="sisaltomuutos-perustelut"]')
      expect(sisaltomuutos).toEqual(sisaltomuutosPerustelut)
    })

    it('should require sisältömuutospäätös', async () => {
      await muutosSendButtonDisabled(page)
      await writeSisältömuutosPäätös(page, 'Testing')
      await muutosSendButtonEnabled(page)
      await writeSisältömuutosPäätös(page, '')
      await muutosSendButtonDisabled(page)
    })

    it('shows disclaimer if accepting with changes', async () => {
      await setMuutoshakemusSisaltoDecision(page, 'accepted_with_changes')
      const disclaimer =  await getElementInnerText(page, '.muutoshakemus-notice')
      expect(disclaimer).toEqual('Olet tekemässä päätöksen, jossa haetut sisältömuutokset hyväksytään muutettuna. Varmista, että perusteluissa hakijalle kuvataan mitkä haetuista sisältömuutoksista hyväksytään ja mitkä hylätään.')
      await setMuutoshakemusSisaltoDecision(page, 'accepted')
    })

    describe('sending decision', () => {
      beforeAll(async () => {
        await writeSisältömuutosPäätös(page, 'Muutokset hankkeen sisältöön tai toteutustapaan hyväksytään  hakemuksen mukaisesti.')
        await saveMuutoshakemus(page)
      }, 60000)

      it('shows muutoshakemus as käsitelty', async () => {
        const statusText = await textContent(page, '[data-test-id="paatos-status-text"]')
        expect(statusText).toEqual('Käsitelty')
      })

      it('shows the original application text', async () => {
        const sentApplicationInformation = await textContent(page, '[data-test-id="sisaltomuutos-perustelut"]')
        expect(sentApplicationInformation).toContain(sisaltomuutosPerustelut)
      })
    })
  })
})


