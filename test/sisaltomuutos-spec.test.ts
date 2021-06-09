import { Browser, Page } from 'puppeteer'

import {
  mkBrowser,
  log,
  getFirstPage,
  setPageErrorConsoleLogger,
  clickElement,
  Budget,
  createRandomHakuValues,
} from './test-util'
import {
  navigateToHakijaMuutoshakemusPage,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
  fillSisaltomuutosPerustelut,
  clickSendMuutoshakemusButton
} from './muutoshakemus-util'

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


  beforeEach(() => {
    log(`Starting test: ${expect.getState().currentTestName}`)
  })

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)

    const { hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(page, haku, answers, budget)
    hakemusID = hakemusId
  })

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  it("hakija can submit sisaltomuutos", async () => {
    await navigateToHakijaMuutoshakemusPage(page, hakemusID)
    await clickElement(page, '#checkbox-haenSisaltomuutosta')
    await fillSisaltomuutosPerustelut(page, 'Muutamme kaiken muuttamisen ilosta')
    await clickSendMuutoshakemusButton(page)
  })

  it("shows sisältömuutos-related information in päätös", async () => {
    await navigateToHakijaMuutoshakemusPage(page, hakemusID)
    await clickElement(page, '#checkbox-haenSisaltomuutosta')
    await fillSisaltomuutosPerustelut(page, 'Muutamme kaiken muuttamisen ilosta')
    await clickSendMuutoshakemusButton(page)
  })
})

