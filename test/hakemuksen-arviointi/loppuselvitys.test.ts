import {Browser, Page} from "puppeteer"
import moment from "moment"

import { ratkaiseMuutoshakemusEnabledAvustushaku } from "../muutoshakemus/muutospaatosprosessi-util"

import {
  clearAndSet,
  clearAndType,
  clickElement,
  clickElementWithText,
  countElements,
  createRandomHakuValues,
  dummyPdfPath,
  getAllEmails,
  getElementAttribute,
  getElementInnerText,
  getFirstPage,
  hasElementAttribute,
  isDisabled,
  mkBrowser,
  navigate,
  navigateToLoppuselvitysTab,
  sendLoppuselvitysAsiatarkastamattaNotifications,
  setPageErrorConsoleLogger,
  textContent,
  uploadFile,
  VIRKAILIJA_URL,
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
    let loppuselvitysFormUrl: string | null | undefined

    beforeAll(async () => {
      await navigateToLoppuselvitysTab(page, avustushakuID, hakemusID)
      loppuselvitysFormUrl = await getElementAttribute(page, '[data-test-id="selvitys-link"]', 'href')
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

      await navigateToLoppuselvitysTab(page, avustushakuID, hakemusID)
    })

    it('virkailija sees loppuselvitys answers', async () => {
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

    it('virkailija can not accept loppuselvitys while it is not verified', async () => {
      expect(await countElements(page, '[data-test-id="selvitys-email"]')).toEqual(0)
    })

    it('loppuselvitys-asiatarkastamatta notification is sent to virkailija', async () => {
      const oldEmailCount = (await getAllEmails('loppuselvitys-asiatarkastamatta')).filter(e => e["to-address"].includes('santeri.horttanainen@reaktor.com')).length
      await sendLoppuselvitysAsiatarkastamattaNotifications()

      const emails = (await getAllEmails('loppuselvitys-asiatarkastamatta')).filter(e => e["to-address"].includes('santeri.horttanainen@reaktor.com'))
      expect(emails.length).toEqual(oldEmailCount + 1)
      const loppuselvitysAsiatarkastamattaNotification = emails.pop()
      expect(loppuselvitysAsiatarkastamattaNotification?.subject).toEqual('Asiatarkastamattomia loppuselvityksiä')
      expect(loppuselvitysAsiatarkastamattaNotification?.formatted).toEqual(`Hei!

1 loppuselvitystä odottaa asiatarkastustasi valtionavustusjärjestelmässä. Tarkastamattomia loppuselvityksiä on seuraavissa valtionavustuksissa:

- Loppuselvityksiä 1 kpl: ${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/

Hyväksyttyäsi asiatarkastuksen, lähtee tarkastuksesta automaattisesti tieto taloustarkastukseen, eikä järjestelmän ulkopuolista ilmoitusta asiatarkastuksesta tarvita.

Taloustarkastaja lähettää tiedon loppuselvityksen hyväksymisestä avustuksen saajalle, kun taloustarkastus on hyväksytty. Tarkemmat ohjeet loppuselvityksen käsittelyyn: https://intra.oph.fi/pages/viewpage.action?pageId=99516848

Huom! Mikäli olet jo tarkastanut loppuselvityksen, josta saat muistutuksen, voit kuitata loppuselvityksen tarkastetuksi klikkaamalla VA-järjestelmässä hankekohtaisesti "Hyväksy asiatarkastus ja lähetä taloustarkastukseen". Tämän jälkeen et saa enää muistutusta kyseisestä asiatarkastuksesta.

Ennen vuotta 2020 avattujen valtionavustusten osalta asiatarkastusten käsittely ja ilmoittaminen taloustarkastajalle tehdään toistaiseksi kuten aiemminkin.`)
    })

    describe('virkailija verifies loppuselvitys information', () => {
      const textareaSelector = 'textarea[name="information-verification"]'

      beforeAll(async () => {
        await navigateToLoppuselvitysTab(page, avustushakuID, hakemusID)

        await clearAndType(page, textareaSelector, 'Hyvältä näyttääpi')
        await clickElement(page, 'button[name="submit-verification"]')

        await page.waitForSelector('[data-test-id="selvitys-email"]')
      })

      it('hakija can not edit loppuselvitys after information has been verified', async () => {
        if (!loppuselvitysFormUrl) {
          throw new Error('could not find loppuselvitys form url')
        }

        await navigate(page, loppuselvitysFormUrl)
        expect(await getElementInnerText(page, 'span[id="textArea-0"]')).toEqual('Yhteenveto')
        await hasElementAttribute(page, 'button[id="submit"]', 'disabled')
        await page.waitForSelector('textarea[id="textArea-0"]', { hidden: true })
      })

      it('information verification is shown', async () => {
        await navigateToLoppuselvitysTab(page, avustushakuID, hakemusID)
        expect(await textContent(page, textareaSelector)).toEqual('Hyvältä näyttääpi')
        expect(await isDisabled(page, textareaSelector)).toEqual(true)
        expect(await getElementInnerText(page, '[data-test-id=verifier]')).toEqual('_ valtionavustus')
        expect(moment(await getElementInnerText(page, '[data-test-id=verified-at]'), 'D.M.YYYY [klo] H.mm').isSameOrBefore()).toBeTruthy()
      })

      it('loppuselvitys-asiatarkastamatta notification is not sent to virkailija anymore', async () => {
        const oldEmails = await getAllEmails('loppuselvitys-asiatarkastamatta')
        const oldEmailCount = oldEmails.filter(e => e["to-address"].includes('santeri.horttanainen@reaktor.com')).length
        await sendLoppuselvitysAsiatarkastamattaNotifications()

        const allEmails = await getAllEmails('loppuselvitys-asiatarkastamatta')
        const emails = allEmails.filter(e => e["to-address"].includes('santeri.horttanainen@reaktor.com'))
        if (emails.length === oldEmailCount + 1) { // if user _ valtionavustus has other submitted loppuselvitys
          const loppuselvitysAsiatarkastamattaNotification = emails.pop()
          expect(loppuselvitysAsiatarkastamattaNotification?.subject).toEqual('Asiatarkastamattomia loppuselvityksiä')
          expect(loppuselvitysAsiatarkastamattaNotification?.formatted).not.toContain(`- Loppuselvityksiä 1 kpl: ${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/`)
        } else {
          expect(emails.length).toEqual(oldEmailCount)
        }
      })

      it('virkailija accepts loppuselvitys', async () => {
        await clearAndType(page, '#selvitys-email-title', 'Hieno homma')
        await clearAndSet(page, '.selvitys-email-message', 'Hyvä juttu')
        await clickElement(page, '#submit-selvitys')

        await page.waitForSelector('.selvitys-email-message--sent')

        await navigate(page, `/avustushaku/${avustushakuID}/`)
        const loppuselvitysStatus = await getElementInnerText(page, '[data-test-id="loppuselvitys-column"]')
        expect(loppuselvitysStatus).toEqual('Hyväksytty')
      })
    })
  })
})
