import {Browser, Page} from "puppeteer"

import { ratkaiseMuutoshakemusEnabledAvustushaku } from "../muutoshakemus/muutospaatosprosessi-util"

import {
  clearAndType,
  clickElement,
  clickElementWithText,
  createRandomHakuValues,
  dummyPdfPath,
  getElementAttribute,
  getElementInnerText,
  getFirstPage,
  mkBrowser,
  navigate,
  navigateToLoppuselvitysTab,
  setPageErrorConsoleLogger,
  uploadFile,
  waitForElementWithText,
  waitForNewTab
} from "../test-util"

jest.setTimeout(400_000)

describe("Loppuselvitys", () => {
  let browser: Browser
  let page: Page
  const answers = {
    contactPersonEmail: "erkki.esimerkki@example.com",
    contactPersonName: "Erkki Esimerkki",
    contactPersonPhoneNumber: "666",
    projectName: "Rahassa kylpijät Ky Ay Oy",
  }

  let avustushakuID: number
  let hakemusID: number

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)

    const haku = await ratkaiseMuutoshakemusEnabledAvustushaku(page, createRandomHakuValues('loppuselvitys'), answers)
    avustushakuID = haku.avustushakuID
    hakemusID = haku.hakemusID

    await navigateToLoppuselvitysTab(page, avustushakuID, hakemusID)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  it('tab in hakemuksen arviointi should have link to correct loppuselvitys form for the hakemus', async () => {
    const [loppuselvitysFormPage] = await Promise.all([
      waitForNewTab(page),
      clickElementWithText(page, 'a', 'Linkki lomakkeelle'),
    ])
    await loppuselvitysFormPage.waitForNavigation()
    
    await waitForElementWithText(loppuselvitysFormPage, 'h1', 'Loppuselvitys') 
    await waitForElementWithText(loppuselvitysFormPage, 'button', 'Lähetä käsiteltäväksi') 

    await loppuselvitysFormPage.close()
  })

  describe('hakija fills and sends loppuselvitys form', () => {
    beforeAll(async () => {
      await navigateToLoppuselvitysTab(page, avustushakuID, hakemusID)
      const loppuselvitysFormUrl = await getElementAttribute(page, '[data-test-id="selvitys-link"]', 'href')
      if (!loppuselvitysFormUrl) {
        throw new Error('could not find loppuselvitys form url')
      }

      await navigate(page, loppuselvitysFormUrl)
      await page.waitForSelector('[id="textArea-0"]')
  
      await clearAndType(page, '[id="textArea-0"]', 'Yhteenveto')
      await clearAndType(page, '[id="textArea-2"]', 'Työn jako')
      await clearAndType(page, '[id="project-description.project-description-1.goal"]', 'Tavoite')
      await clearAndType(page, '[id="project-description.project-description-1.activity"]', 'Toiminta')
      await clearAndType(page, '[id="project-description.project-description-1.result"]', 'Tulokset')
      await clearAndType(page, '[id="textArea-1"]', 'Arviointi')
      await clearAndType(page, '[id="textArea-3"]', 'Tiedotus')
  
      await clickElement(page, 'label[for="project-outcomes.project-outcomes-1.outcome-type.radio.0"]')
      await clearAndType(page, '[id="project-outcomes.project-outcomes-1.description"]', 'Kuvaus')
      await clearAndType(page, '[id="project-outcomes.project-outcomes-1.address"]', 'Saatavuustiedot')
  
      await clickElement(page, 'label[for="radioButton-good-practices.radio.1"]')
      await clearAndType(page, '[id="textArea-4"]', 'Lisätietoja')
  
      await uploadFile(page, '[name="namedAttachment-0"]', dummyPdfPath)
  
      await clickElement(page, 'button#submit:not([disabled])')
      await page.waitForFunction(() => (document.querySelector("#topbar #form-controls button#submit") as HTMLInputElement).textContent === "Loppuselvitys lähetetty")
    })

    it('virkailija sees loppuselvitys answers', async () => {
      await navigateToLoppuselvitysTab(page, avustushakuID, hakemusID)

      expect(await getElementInnerText(page, '#preview-container-loppuselvitys #textArea-0')).toEqual('Yhteenveto')
      expect(await getElementInnerText(page, '#preview-container-loppuselvitys #textArea-2')).toEqual('Työn jako')
      expect(await getElementInnerText(page, '#preview-container-loppuselvitys [id="project-description.project-description-1.goal"]')).toEqual('Tavoite')
      expect(await getElementInnerText(page, '#preview-container-loppuselvitys [id="project-description.project-description-1.activity"]')).toEqual('Toiminta')
      expect(await getElementInnerText(page, '#preview-container-loppuselvitys [id="project-description.project-description-1.result"]')).toEqual('Tulokset')
      expect(await getElementInnerText(page, '#preview-container-loppuselvitys #textArea-1')).toEqual('Arviointi')
      expect(await getElementInnerText(page, '#preview-container-loppuselvitys #textArea-3')).toEqual('Tiedotus')

      expect(await getElementInnerText(page, '#preview-container-loppuselvitys [id="project-outcomes.project-outcomes-1.outcome-type"]')).toEqual('Toimintamalli')
      expect(await getElementInnerText(page, '#preview-container-loppuselvitys [id="project-outcomes.project-outcomes-1.description"]')).toEqual('Kuvaus')
      expect(await getElementInnerText(page, '#preview-container-loppuselvitys [id="project-outcomes.project-outcomes-1.address"]')).toEqual('Saatavuustiedot')

      expect(await getElementInnerText(page, '#preview-container-loppuselvitys #radioButton-good-practices')).toEqual('Ei')
      expect(await getElementInnerText(page, '#preview-container-loppuselvitys #textArea-4')).toEqual('Lisätietoja')
    })

    it('virkailija accepts loppuselvitys', async () => {
      await navigateToLoppuselvitysTab(page, avustushakuID, hakemusID)

      await clearAndType(page, '#selvitys-email-title', 'Hieno homma')
      await clearAndType(page, '.selvitys-email-message', 'Hyvä juttu')
      await clickElement(page, '#submit-selvitys')

      await page.waitForSelector('[data-test-id="selvitys-sent"]')

      await navigate(page, `/avustushaku/${avustushakuID}/`)
      const loppuselvitysStatus = await getElementInnerText(page, '[data-test-id="loppuselvitys-column"]')
      expect(loppuselvitysStatus).toEqual('Hyväksytty')
    })
  })
})
