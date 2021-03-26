import { Browser, Page } from "puppeteer"
import moment from 'moment'

import {
  VIRKAILIJA_URL,
  HAKIJA_URL,
  createValidCopyOfEsimerkkihakuAndReturnTheNewId,
  getAcceptedPäätösEmails,
  getValiselvitysEmails,
  getLoppuselvitysEmails,
  mkBrowser,
  acceptAvustushaku,
  clearAndSet,
  navigateHakija,
  navigateToNewHakemusPage,
  standardizedHakulomakeJson,
  getFirstPage,
  ratkaiseAvustushaku,
  ratkaiseMuutoshakemusEnabledAvustushaku,
  publishAvustushaku,
  fillAndSendHakemus,
  acceptHakemus,
  clickCodeVisibilityButton,
  clickElementWithTestId,
  assertCodeIsVisible,
  expectedResponseFromExternalAPIhakemuksetForAvustushaku,
  getLinkToMuutoshakemusFromSentEmails,
  actualResponseFromExternalAPIhakemuksetForAvustushaku,
  createUniqueCode,
  closeAvustushakuByChangingEndDateToPast,
  navigate,
  clickElementWithText,
  clickElement,
  clearAndType,
  waitForArvioSave,
  fillAndSendHakemusAndReturnHakemusId,
  resolveAvustushaku,
  sendPäätös,
  textContent,
  selectValmistelijaForHakemus,
  deleteAttachment,
  dummyPdfPath,
  uploadFile,
  verifyTooltipText,
  waitForSave,
  addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel,
  typeValueInFieldAndExpectValidationError,
  typeValueInFieldAndExpectNoValidationError,
  gotoVäliselvitysTab,
  waitForElementWithText,
  waitForElementWIthTestId,
  fillAndSendVäliselvityspyyntö,
  downloadExcelExport,
  clickFormSaveAndWait,
  addFieldToFormAndReturnElementIdAndLabel,
  TEST_Y_TUNNUS,
  publishAndFillMuutoshakemusEnabledAvustushaku,
  navigateToHakemuksenArviointi,
  getTäydennyspyyntöEmails,
  navigateToHakijaMuutoshakemusPage,
  waitUntilMinEmails,
  setPageErrorConsoleLogger,
  randomString,
  log,
  navigateToHakemus,
  countElements,
  getElementInnerText,
  navigateToPaatos
} from './test-util'
import axios from 'axios'

jest.setTimeout(400_000)

describe("Puppeteer tests", () => {
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

  it("should allow removing attachment from hakemus", async function() {
    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await publishAvustushaku(page)
    await fillAndSendHakemus(page, avustushakuID, async function() {
      await deleteAttachment(page, "financial-information-form")
      await uploadFile(page, "input[name='financial-information-form']", dummyPdfPath)
    })
  })

  const allowBasicAvustushakuFlowAndCheckEachHakemusHasValmistelija = (getPage: () => Page, multiplePaymentBatches: boolean) => async () => {
    const page = getPage()
    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    if (multiplePaymentBatches) {
      await clickElement(page, "label[for='set-maksuera-true']")
    } else {
      await clickElement(page, "label[for='set-maksuera-false']")
    }
    await waitForSave(page)

    await publishAvustushaku(page)
    await fillAndSendHakemus(page, avustushakuID)

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)

    // Accept the hakemus
    const { hakemusID } = await navigateToHakemuksenArviointi(page, avustushakuID, "Akaan kaupunki")

    log("Hakemus ID:", hakemusID)

    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
    await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
    await Promise.all([
      clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']"),
      waitForArvioSave(page, avustushakuID, hakemusID),
    ])

    await resolveAvustushaku(page, avustushakuID)

    // Sending päätös should give error because the hakemus is missing valmistelija
    await sendPäätös(page, avustushakuID)
    expect(await textContent(page, "#päätös-send-error")).toEqual(`Hakemukselle numero ${hakemusID} ei ole valittu valmistelijaa. Päätöksiä ei lähetetty.`)

    await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "_ valtionavustus")

    await sendPäätös(page, avustushakuID)
    const tapahtumaloki = await page.waitForSelector(".tapahtumaloki")
    const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
    expect(logEntryCount).toEqual(1)
  }

  describe("should allow basic avustushaku flow and check each hakemus has valmistelija", () => {
    it("when the avustushaku has a single payment batch", allowBasicAvustushakuFlowAndCheckEachHakemusHasValmistelija(() => page, false))
    it("when the avustushaku has multiple payment batches", allowBasicAvustushakuFlowAndCheckEachHakemusHasValmistelija(() => page, true))
  })

  it("shows the same updated date on the Päätös tab as on the Väliselvitys and Loppuselvitys tabs", async function() {

    await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await clickElementWithText(page, "span", "Päätös")
    const paatosUpdatedAt = textContent(page, "#paatosUpdatedAt")

    await clickElementWithText(page, "span", "Väliselvitys")
    const valiselvitysUpdatedAt = textContent(page, "#valiselvitysUpdatedAt")

    await clickElementWithText(page, "span", "Loppuselvitys")
    const loppuselvitysUpdatedAt = textContent(page, "#loppuselvitysUpdatedAt")

    return Promise.all([paatosUpdatedAt, valiselvitysUpdatedAt, loppuselvitysUpdatedAt])
      .then(([paatos, valiselvitys, loppuselvitys]) => {
        expect(paatos).toEqual(valiselvitys)
        expect(paatos).toEqual(loppuselvitys)
      })
  })

  it("updates only the update date on Päätös tab when päätös is modified", async function() {

    await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await clickElementWithText(page, "span", "Päätös")

    await page.waitFor(70000)
    await clearAndType(page, "#decision\\.taustaa\\.fi", "Burger Time")
    await waitForSave(page)

    const paatosUpdatedAt = textContent(page, "#paatosUpdatedAt")

    await clickElementWithText(page, "span", "Väliselvitys")
    const valiselvitysUpdatedAt = textContent(page, "#valiselvitysUpdatedAt")

    await clickElementWithText(page, "span", "Loppuselvitys")
    const loppuselvitysUpdatedAt = textContent(page, "#loppuselvitysUpdatedAt")

    return Promise.all([paatosUpdatedAt, valiselvitysUpdatedAt, loppuselvitysUpdatedAt])
      .then(([paatos, valiselvitys, loppuselvitys]) => {
        expect(valiselvitys).toEqual(loppuselvitys)
        expect(paatos).not.toEqual(valiselvitys)
      })
  })

  it("supports fields that accept only decimals", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId, fieldLabel } = await addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page, avustushakuID, "decimalField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page)

    await fillAndSendHakemus(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectValidationError(page, fieldId, 'Not an decimal', fieldLabel, 'fi: Syötä yksi numeroarvo')
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, '4.2')
    })
  })

  it("supports fields that accept only whole numbers", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId, fieldLabel } = await addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page, avustushakuID, "integerField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page)

    await fillAndSendHakemus(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectValidationError(page, fieldId, 'Not an integer', fieldLabel, 'fi: Syötä arvo kokonaislukuina')
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, '420')
    })
  })

  it("supports editing and saving the values of the fields", async function() {

    await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await clickElementWithText(page, "span", "Hakulomake")
    await page.waitForFunction(() => (document.querySelector("button#saveForm") as HTMLInputElement).disabled === true)
    await clearAndType(page, "textarea[name='duration-help-text-fi']", "Gimblegamble")
    await page.waitForFunction(() => (document.querySelector("button#saveForm") as HTMLInputElement).disabled === false)
  })


  it("produces väliselvitys sheet in excel export", async function() {
    const { avustushakuID } = await ratkaiseAvustushaku(page)

    await verifyTooltipText(
      page,
      `[data-test-id="väliselvitys-välilehti"] a`,
      /Tällä välilehdellä laaditaan ja lähetetään avustuksen saajien väliselvityspyynnöt.*/
    )

    await gotoVäliselvitysTab(page, avustushakuID)
    await clickElementWithText(page, "button", "Lähetä väliselvityspyynnöt")
    const responseP = page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/send-notification`)
    await waitForElementWithText(page, "span", "Lähetetty 1 viestiä")
    const response: any = await (responseP.then(_ => _.json()))
    const väliselvitysKey = response.hakemukset[0].user_key
    log(`Väliselvitys user_key: ${väliselvitysKey}`)

    await fillAndSendVäliselvityspyyntö(page, avustushakuID, väliselvitysKey)

    const workbook = await downloadExcelExport(page, avustushakuID)

    expect(workbook.SheetNames).toMatchObject([ "Hakemukset", "Hakemuksien vastaukset", "Väliselvityksien vastaukset", "Loppuselvityksien vastaukset", "Tiliöinti" ])
    const sheet = workbook.Sheets["Väliselvityksien vastaukset"]

    expect(sheet.B1.v).toEqual("Hakijaorganisaatio")
    expect(sheet.B2.v).toEqual("Akaan kaupungin kissojenkasvatuslaitos")

    expect(sheet.C1.v).toEqual("Hankkeen nimi")
    expect(sheet.C2.v).toEqual("Kissojen koulutuksen tehostaminen")
  })

  it("should allow user to add koodistokenttä to form and save it", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await navigate(page, `/admin/form-editor/?avustushaku=${avustushakuID}`)
    // Add new Koodistokenttä
    await page.hover(".soresu-field-add-header")
    await clickElementWithText(page, "a", "Koodistokenttä")
    // Select koodisto for the field
    const input = await page.waitFor(".koodisto-dropdown input")
    await input.type("automaatio")
    await clickElementWithText(page, "li", "automaatioyliasentajan eat järjestys")
    // Select input type for the field
    await clickElementWithText(page, "label", "Pudotusvalikko")

    await clickFormSaveAndWait(page, avustushakuID)
  })

  describe('When haku #1 has been created and published', () => {
    let fieldId: string
    let avustushakuID: number
    let hakemusID: number
    const randomValueForProjectNutshell = randomString()

    beforeAll(async () => {
      avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
      fieldId = (await addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, "project-goals", "textField")).fieldId

      await clickElementWithText(page, "span", "Haun tiedot")
      await publishAvustushaku(page)
    })

    describe('And new hakemus has been created', () => {
      beforeAll(async () => {
        hakemusID = await fillAndSendHakemusAndReturnHakemusId(page, avustushakuID, async () => {
          await typeValueInFieldAndExpectNoValidationError(page, fieldId, randomValueForProjectNutshell)
        })
        await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
      })

      it('virkailija can add comments', async () => {
        await navigateToHakemus(page, avustushakuID, hakemusID)
        await clearAndType(page, '#comment-input', 'ei jatkoon')
        await clickElement(page, '[data-test-id=send-comment]')

        await page.waitForSelector('.comment-list')
        const comments = await countElements(page, '.single-comment')
        expect(comments).toEqual(1)
        const comment = await getElementInnerText(page, '.single-comment > div')
        expect(comment).toContain('ei jatkoon')
      })

      describe('And hakemus has been approved', () => {
        beforeAll(async () => {
          await acceptHakemus(page, avustushakuID, hakemusID, async () => {
            await clickElementWithTestId(page, 'tab-seuranta')
            await clickElementWithTestId(page, 'set-allow-visibility-in-external-system-true')
            await waitForSave(page)
          })
        })

        it("shows the contents of the project-goals -field of a hakemus in external api as 'nutshell'", async () => {
          const expectedResponse = await expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID, hakemusID, randomValueForProjectNutshell)
          const actualResponse = await actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID)
          expect(actualResponse).toMatchObject(expectedResponse)
        })

        describe('And päätös has been created', () => {
          beforeAll(async () => {
            await resolveAvustushaku(page, avustushakuID)
            await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "_ valtionavustus")
            await sendPäätös(page, avustushakuID)
          })

          it('shows the standardized käyttöaika on päätös', async () => {
            await navigateToPaatos(page, avustushakuID, hakemusID)
            await page.waitForXPath("//h2[contains(text(), 'Avustuksen käyttöaika')]")
            const firstDay = await page.$x("//p[contains(text(), 'Avustuksen ensimmäinen käyttöpäivä 20.04.1969')]")
            expect(firstDay.length).toEqual(1)
            const lastDay = await page.$x("//p[contains(text(), 'Avustuksen viimeinen käyttöpäivä 20.04.4200')]")
            expect(lastDay.length).toEqual(1)
          })

          it('shows the väliselvitys log', async () => {
            await navigate(page, `/admin/valiselvitys/?avustushaku=${avustushakuID}`)
            await clickElement(page, '[data-test-id=send-valiselvitys]')
            await page.waitForSelector('div.tapahtumaloki')
            const sender = await textContent(page, 'span.sender')
            expect(sender).toEqual('_ valtionavustus')
            const sent = await textContent(page, 'span.sentCount')
            expect(sent).toEqual('1')
          })

          it('shows the loppuselvitys log', async () => {
            await navigate(page, `/admin/loppuselvitys/?avustushaku=${avustushakuID}`)
            await clickElement(page, '[data-test-id=send-loppuselvitys]')
            await page.waitForSelector('div.tapahtumaloki')
            const sender = await textContent(page, 'span.sender')
            expect(sender).toEqual('_ valtionavustus')
            const sent = await textContent(page, 'span.sentCount')
            expect(sent).toEqual('1')
          })
        })
      })
    })
  })

  describe('When haku #2 has been created and published', () => {
    let fieldId: string
    let avustushakuID: number
    let hakemusID: number
    const randomValueForProjectNutshell = randomString()

    beforeAll(async () => {
      avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
      fieldId = (await addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, "project-nutshell", "textField")).fieldId

      await clickElementWithText(page, "span", "Haun tiedot")
      await publishAvustushaku(page)
    })

    it('Shows hankkeen alkamisaika in external API', async () => {
      const response = await axios.get(`${VIRKAILIJA_URL}/api/v2/external/avustushaut/?year=2020`)
      const haku = response.data.find((h: { id: number }) => h.id === avustushakuID)
      expect(haku['hankkeen-alkamispaiva']).toBe('1969-04-20')
    })

    it('Shows hankkeen paattymispaiva in external API', async () => {
      const response = await axios.get(`${VIRKAILIJA_URL}/api/v2/external/avustushaut/?year=2020`)
      const haku = response.data.find((h: { id: number }) => h.id === avustushakuID)
      expect(haku['hankkeen-paattymispaiva']).toBe('4200-04-20')
    })

    describe('And new hakemus has been created', () => {
      beforeAll(async () => {
        hakemusID = await fillAndSendHakemusAndReturnHakemusId(page, avustushakuID, async () => {
          await typeValueInFieldAndExpectNoValidationError(page, fieldId, randomValueForProjectNutshell)
        })
      })

      describe('And hakemus has been approved', () => {
        beforeAll(async () => {
          await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
          await acceptHakemus(page, avustushakuID, hakemusID, async () => {
            await clickElementWithTestId(page, 'tab-seuranta')
            await clickElementWithTestId(page, 'set-allow-visibility-in-external-system-true')
            await waitForSave(page)
          })
        })

        it("shows the contents of the project-nutshell -field of a hakemus in external api as 'nutshell'", async () => {
          const expectedResponse = await expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID, hakemusID, randomValueForProjectNutshell)
          const actualResponse = await actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID)
          expect(actualResponse).toMatchObject(expectedResponse)
        })
      })
    })
  })

  it("allows previewing täydennyspyyntö to hakija", async () => {
    const randomId = randomString()
    const { avustushakuID } = await publishAndFillMuutoshakemusEnabledAvustushaku(page, {
      registerNumber: "1621/2020",
      avustushakuName: `Täydennyspyyntöavustushaku ${randomId}`,
    }, {
      contactPersonEmail: "lotta.lomake@example.com",
      contactPersonName: "Lotta Lomake",
      contactPersonPhoneNumber: "666",
      projectName: "Lomakkeentäyttörajoitteiset Ry",
    })
    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
    await navigateToHakemuksenArviointi(page, avustushakuID, "Akaan kaupunki")

    const täydennyspyyntöText = "Jaahas miltäköhän tämä täydennyspyyntö mahtaa näyttää sähköpostissa?"
    await fillTäydennyspyyntöField(page, täydennyspyyntöText)
    await clickElementWithText(page, "a", "Esikatsele")

    expect(await textContent(page, "[data-test-id='change-request-preview-subject']"))
      .toStrictEqual(`Otsikko: Täydennyspyyntö avustushakemukseesi`)
    expect(await textContent(page, "[data-test-id='change-request-preview-sender']"))
      .toStrictEqual(`Lähettäjä: no-reply@csc.fi`)
    expect(await textContent(page, "[data-test-id='change-request-preview-content']"))
      .toStrictEqual(`Avustushakemus: Täydennyspyyntöavustushaku ${randomId}

Täydennyspyyntö:
"${täydennyspyyntöText}"

Pääset täydentämään avustushakemusta tästä linkistä: [linkki hakemukseen]
Muokkaa vain pyydettyjä kohtia.

Lisätietoja voitte kysyä sähköpostitse osoitteesta valtionavustukset@oph.fi

Hausta vastaava valmistelija on mainittu hakutiedotteessa.

Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki

puhelin 029 533 1000
faksi 029 533 1035
etunimi.sukunimi@oph.fi
`)
  })

  it("allows sending täydennyspyyntö to hakija", async () => {
    const randomId = randomString()

    const { avustushakuID, userKey } = await publishAndFillMuutoshakemusEnabledAvustushaku(page, {
      registerNumber: "1620/2020",
      avustushakuName: `Täydennyspyyntöavustushaku ${randomId}`,
    }, {
      contactPersonEmail: "lotta.lomake@example.com",
      contactPersonName: "Lotta Lomake",
      contactPersonPhoneNumber: "666",
      projectName: "Lomakkeentäyttörajoitteiset Ry",
    })

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
    const { hakemusID } = await navigateToHakemuksenArviointi(page, avustushakuID, "Akaan kaupunki")

    expect(await getTäydennyspyyntöEmails(avustushakuID, hakemusID)).toHaveLength(0)

    const täydennyspyyntöText = "Joo ei tosta hakemuksesta ota mitään tolkkua. Voisitko tarkentaa?"
    await fillTäydennyspyyntöField(page, täydennyspyyntöText)
    await clickToSendTäydennyspyyntö(page, avustushakuID, hakemusID)

    expect(await textContent(page, "#arviointi-tab .change-request-title"))
      .toMatch(/\* Täydennyspyyntö lähetetty \d{1,2}\.\d{1,2}\.\d{4} \d{1,2}\.\d{1,2}/)
    // The quotes around täydennyspyyntö message are done with CSS :before
    // and :after pseudo elements and not shown in Node.textContent
    expect(await textContent(page, "#arviointi-tab .change-request-text"))
      .toStrictEqual(täydennyspyyntöText)

    const emails = await waitUntilMinEmails(getTäydennyspyyntöEmails, 1, avustushakuID, hakemusID)
    expect(emails).toHaveLength(1)
    expect(emails[0]['to-address']).toHaveLength(1)
    expect(emails[0]['to-address']).toContain("lotta.lomake@example.com")
    expect(emails[0]['bcc']).toStrictEqual("santeri.horttanainen@reaktor.com")
    expect(emails[0].formatted).toStrictEqual(`Avustushakemus: Täydennyspyyntöavustushaku ${randomId}

Täydennyspyyntö:
"Joo ei tosta hakemuksesta ota mitään tolkkua. Voisitko tarkentaa?"

Pääset täydentämään avustushakemusta tästä linkistä: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=${userKey}&lang=fi
Muokkaa vain pyydettyjä kohtia.

Lisätietoja voitte kysyä sähköpostitse osoitteesta valtionavustukset@oph.fi

Hausta vastaava valmistelija on mainittu hakutiedotteessa.

Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki

puhelin 029 533 1000
faksi 029 533 1035
etunimi.sukunimi@oph.fi
`)
  })

  async function fillTäydennyspyyntöField(page: Page, täydennyspyyntöText: string): Promise<void> {
    await clickElementWithText(page, "button", "Pyydä täydennystä")
    await page.type("[data-test-id='täydennyspyyntö__textarea']", täydennyspyyntöText)
  }

  async function clickToSendTäydennyspyyntö(page: Page, avustushakuID: number, hakemusID: number) {
    await Promise.all([
      page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/change-requests`),
      page.click("[data-test-id='täydennyspyyntö__lähetä']"),
    ])
  }

  it("sends päätös, väliselvityspyyntö, and loppuselvityspyyntö emails to correct contact and hakemus emails", async () => {
    const { avustushakuID, hakemusID } = await ratkaiseMuutoshakemusEnabledAvustushaku(page, {
      registerNumber: "420/2021",
      avustushakuName: `Testiavustushaku ${randomString()} - ${moment(new Date()).format('YYYY-MM-DD hh:mm:ss:SSSS')}`
    }, {
      contactPersonEmail: "yrjo.yhteyshenkilo@example.com",
      contactPersonName: "Yrjö Yhteyshenkilö",
      contactPersonPhoneNumber: "0501234567",
      projectName: "Hanke päätöksen uudelleenlähetyksen testaamiseksi",
    })
    const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(avustushakuID, hakemusID)

    let emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, avustushakuID, hakemusID)
    expect(emails).toHaveLength(1)
    let email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "yrjo.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])

    await resendPäätökset(avustushakuID)
    emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 2, avustushakuID, hakemusID)
    expect(emails).toHaveLength(2)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "yrjo.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])

    await changeContactPersonEmail(page, linkToMuutoshakemus, "uusi.yhteyshenkilo@example.com")
    await resendPäätökset(avustushakuID)

    emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 3, avustushakuID, hakemusID)
    expect(emails).toHaveLength(3)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "uusi.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])

    await navigate(page, `/admin/valiselvitys/?avustushaku=${avustushakuID}`)
    await clickElement(page, '[data-test-id=send-valiselvitys]')

    emails = await waitUntilMinEmails(getValiselvitysEmails, 1, avustushakuID, hakemusID)
    expect(emails).toHaveLength(1)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "uusi.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])

    await navigate(page, `/admin/loppuselvitys/?avustushaku=${avustushakuID}`)
    await clickElement(page, '[data-test-id=send-loppuselvitys]')

    emails = await waitUntilMinEmails(getLoppuselvitysEmails, 1, avustushakuID, hakemusID)
    expect(emails).toHaveLength(1)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "uusi.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])
  })

  async function resendPäätökset(avustushakuID: number): Promise<void> {
    await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
    await clickElementWithText(page, "button", "Lähetä 1 päätöstä uudelleen")
    await clickElementWithText(page, "button", "Vahvista päätösten uudellenlähetys")
    await waitForElementWIthTestId(page, "resend-completed-message")
  }

  async function changeContactPersonEmail(page: Page, linkToMuutoshakemus: string, email: string): Promise<void> {
    await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
    await clearAndType(page, '#muutoshakemus__email', email)
    await clickElement(page, "#send-muutospyynto-button")
  }

  describe('When virkailija navigates to codes page', () => {
    beforeAll(async () => {
      await navigate(page, '/admin-ui/va-code-values/')
    })

    describe('And creates new koodi', () => {
      let code: number
      beforeAll(async () => {
        code = await createUniqueCode(page)
      })

      describe('And navigates back to codes page', () => {
        beforeAll(async () => {
          await navigate(page, '/admin-ui/va-code-values/')
        })

        it('code is present in the page', async () => {
          await page.waitForSelector(`tr[data-test-id="${code}"]`)
        })

        it('code is visible', async () => {
          await assertCodeIsVisible(page, code, true)
        })

        describe('When virkailija navigates to haku editor', () => {
          beforeAll(async () => {
            await navigate(page, '/admin/haku-editor/')
          })

          it('code is visible in dropdown', async () => {
            await clearAndType(page, '[data-test-id=code-value-dropdown__operational-unit] > div', `${code}`)
            await page.waitForSelector(`[data-test-id="${code}"]`)
          })

        })

        describe('When virkailija hides the code', () => {
          beforeAll(async () => {
            await navigate(page, '/admin-ui/va-code-values/')
            await clickCodeVisibilityButton(page, code, false)
          })

          it('code is not visible on page', async () => {
            await assertCodeIsVisible(page, code, false)
          })


          describe('When virkailija navigates to haku editor', () => {
            beforeAll(async () => {
              await navigate(page, '/admin/haku-editor/')
            })

            it('code is not visible in dropdown', async () => {
              await clearAndType(page, '[data-test-id=code-value-dropdown__operational-unit] > div', `${code}`)
              await page.waitForSelector('[data-test-id=code-value-dropdown__operational-unit] [data-test-id=code-value-dropdown__no-options]')
            })
          })


          describe('When virkailija navigates to code page', () => {
            beforeAll(async () => {
              await navigate(page, '/admin-ui/va-code-values/')
            })

            it('code is still not visible on the page', async () => {
              await assertCodeIsVisible(page, code, false)
            })

            describe('When virkailija sets the code visible', () => {
              beforeAll(async () => {
                await clickCodeVisibilityButton(page, code, true)
              })

              it('the code is visible in the page', async () => {
                await assertCodeIsVisible(page, code, true)
              })

              describe('And when virkailija navigates to code page', () => {
                beforeAll(async () => {
                  await navigate(page, '/admin-ui/va-code-values/')
                })

                it('the code is still visible in the page', async () => {
                  await assertCodeIsVisible(page, code, true)
                })

              })
            })
          })
        })
      })
    })
  })

  describe("Standardized avustushaku", () => {
    it("Create and fill standardized avustushaku", async () => {
      // Create standardized avustushaku
      const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, "standardized avustushaku", "69/420")
      await clickElementWithText(page, "span", "Hakulomake")
      await clearAndSet(page, ".form-json-editor textarea", standardizedHakulomakeJson)
      await clickFormSaveAndWait(page, avustushakuID)

      await clickElementWithText(page, "span", "Haun tiedot")
      await publishAvustushaku(page)

      // Hakija fill standardized avustushaku
      await navigateHakija(page, `/avustushaku/${avustushakuID}/`)

      await page.waitForSelector('#haku-not-open', { hidden: true, timeout: 500 })
      await clearAndType(page, "#primary-email", "ahmo.mischelangelisch@turkles.fi")
      await clickElement(page, "#submit:not([disabled])")

      await navigateToNewHakemusPage(page, avustushakuID)

      await clearAndType(page, "#finnish-business-id", TEST_Y_TUNNUS)
      await clickElement(page, "input.get-business-id")

      await clickElementWithText(page, '*[@id="financing-plan"]/div/div/label[2]', "Kyllä")

      await clearAndType(page, "#applicant-name", "ahmo")
      await clearAndType(page, "[id='textField-0']", "666")
      await clearAndType(page, "[id='textField-2']", "Höyrykuja")
      await clearAndType(page, "[id='textField-3']", "420")
      await clearAndType(page, "[id='textField-4']", "Helvetti")

      await clearAndType(page, "[id='signatories-fieldset-1.name']", "Mestari Tikku")
      await clearAndType(page, "[id='signatories-fieldset-1.email']", "kelarotta@hotmail.com")

      await clickElementWithText(page, "label", "Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko")

      await clickElement(page, "[id='koodistoField-1_input']")
      await clickElementWithText(page, "li", "Kainuu")

      await clearAndType(page, "#bank-iban", "FI95 6682 9530 0087 65")
      await clearAndType(page, "#bank-bic", "OKOYFIHH")

      await clearAndType(page, "#project-name", "Turkles")

      await clickElement(page, "[for='language.radio.0']")

      await clickElementWithText(page, '*[@id="project-plan"]/div/div[2]/label[2]', "Kyllä")
      await clearAndType(page, "[id='precise-former-project']", "Turkles 1, 2 ja 3")
      await clearAndType(page, "[id='project-description.project-description-1.goal']", "Minimoida yöllinen väkivalta maksimaalisella väkivallalla.")
      await clearAndType(page, "[id='project-description.project-description-1.activity']", "Syömme pizzaa, treenaamme vatsalihaksia ja välillä vedämme rikollisua turpaan")
      await clearAndType(page, "[id='project-description.project-description-1.result']", "Tarkoituksemme on lietsoa pelkoa retaleiden sydämiin. YEAAAH passaa se pizza veli!!")

      await clearAndType(page, "[id='us-project-effectiveness']", "Rikollisuuden vähentyminen")
      await clearAndType(page, "[id='textArea-0']", "Emme arvioi, tutki tai selvitä mitään. Toimintatapamme on välitön turpaanveto.")
      await clearAndType(page, "[id='textArea-1']", "Oletko kuuro tai täysi idiootti? Hankeellamme ei ole mitään tekemistä opetussuunnitelman kanssa, ellei rikollisten läksyttämisestä lasketa tälläiseksi. Turkles!!!!")
      await clearAndType(page, "[id='project-spreading-plan']", "Tuotoksemme on ruhjoutuneet kasvot kulmakuppiloissa. Näiden tuotosten levittämiseksi tarvitsemme Apache XIV taisteluhelikopteria.")
      await clearAndType(page, "[id='textArea-2']", "Nunchucks, tri-blade, katana, pizza, apache taisteluhelikopteri, mac-10 konepistooli")
      await clearAndType(page, "[id='project-nutshell']", "Enemmänkin KILPIKONNAN KUORESSA HAHA!!! COWABUNGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!!!!")


      await clearAndType(page, "[id='personnel-costs-row.description']", "Pieninä seteleinä kiitos.")
      await clearAndType(page, "[id='personnel-costs-row.amount']", "69420666")

      await clearAndType(page, "[id='self-financing-amount']", "1")

      await page.waitForFunction(() => (document.querySelector("#topbar #form-controls button#submit") as HTMLInputElement).disabled === false)
      await clickElement(page, "#topbar #form-controls button#submit")
      await page.waitForFunction(() => (document.querySelector("#topbar #form-controls button#submit") as HTMLInputElement).textContent === "Hakemus lähetetty")

      const { hakemusID } = await acceptAvustushaku(page, avustushakuID)
      await navigateToHakijaMuutoshakemusPage(page, avustushakuID, hakemusID)
    })
  })

  describe("Details schmetails", () => {
    it("The /environment endpoint returns true for refuse-enabled in case someone has old version of the web page still open", async () => {
      const response = await axios.get(`${VIRKAILIJA_URL}/environment`).then(r => r.data)
      expect(response["application-change"]["refuse-enabled?"]).toStrictEqual(true)
    })
  })
})


function lastOrFail<T>(xs: ReadonlyArray<T>): T {
  if (xs.length === 0) throw Error("Can't get last element of empty list")
  return xs[xs.length - 1]
}
