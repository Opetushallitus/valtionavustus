import { Browser, Page } from "puppeteer"
import moment from 'moment'

import {
  VIRKAILIJA_URL,
  HAKIJA_URL,
  createValidCopyOfEsimerkkihakuAndReturnTheNewId,
  getAcceptedPäätösEmails,
  getLinkToHakemusFromSentEmails,
  mkBrowser,
  getMuutoshakemusPaatosEmails,
  acceptAvustushaku,
  linkToMuutoshakemusRegex,
  clearAndSet,
  navigateHakija,
  navigateToNewHakemusPage,
  standardizedHakulomakeJson,
  getFirstPage,
  getUserKey,
  ratkaiseAvustushaku,
  getElementInnerText,
  ratkaiseMuutoshakemusEnabledAvustushaku,
  publishAvustushaku,
  hasElementAttribute,
  getElementAttribute,
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
  getMuutoshakemusEmails,
  getValmistelijaEmails,
  expectToBeDefined,
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
  navigateToHakemus,
  MuutoshakemusValues,
  TEST_Y_TUNNUS,
  fillAndSendMuutoshakemus,
  validateMuutoshakemusValues,
  makePaatosForMuutoshakemusIfNotExists,
  publishAndFillMuutoshakemusEnabledAvustushaku,
  navigateToHakemuksenArviointi,
  getTäydennyspyyntöEmails,
  validateMuutoshakemusPaatosCommonValues,
  countElements,
  selectVakioperustelu,
  setCalendarDate,
  navigateToHakijaMuutoshakemusPage,
  waitUntilMinEmails,
  setPageErrorConsoleLogger,
  randomString,
  log
} from "./test-util"
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

  describe('When new haku has been created and published', () => {
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

        it("shows the contents of the project-goals -field of a hakemus in external api as 'nutshell'", async () => {
          const expectedResponse = await expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID, hakemusID, randomValueForProjectNutshell)
          const actualResponse = await actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID)
          expect(actualResponse).toMatchObject(expectedResponse)
        })
      })
    })
  })

  describe('When new haku has been created and published', () => {
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

        describe('When modifying hakemus after they have been approved', () => {
          let modificationPage: Page

          beforeAll(async () => {
            const enabledSubmitButtonSelector = '#virkailija-edit-submit:not([disabled])'
            const kesayliopistoButtonSelector = `[for="type-of-organization.radio.1"]`

            await navigateToHakemus(page, avustushakuID, hakemusID)
            await clickElementWithText(page, "button", "Muokkaa hakemusta")
            const newPagePromise = new Promise<Page>(x => browser.once('targetcreated', target => x(target.page())))
            await clickElementWithText(page, "button", "Siirry muokkaamaan")
            modificationPage = await newPagePromise
            await modificationPage.bringToFront()
            await clickElement(modificationPage, kesayliopistoButtonSelector)
            await clickElement(modificationPage, enabledSubmitButtonSelector)
          })

          afterAll(async () => {
            await page.bringToFront()
          })

          it('The changes are persisted', async () => {
            const organizationType = await textContent(modificationPage, '[id=type-of-organization] span')
            expect(organizationType).toBe('Kesäyliopisto')
          })

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

  it("allows resending päätös emails from päätös tab", async () => {
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

  it("creates a new koodi", async function() {

    await navigate(page, '/admin-ui/va-code-values/')
    const code = await createUniqueCode(page)

    await navigate(page, '/admin-ui/va-code-values/')
    await page.waitForSelector(`tr[data-test-id="${code}"]`)
  })

  it("sets a koodi hidden and visible", async function() {

    await navigate(page, '/admin-ui/va-code-values/')
    const code = await createUniqueCode(page)
    await assertCodeIsVisible(page, code, true)
    await navigate(page, '/admin-ui/va-code-values/')

    await clickCodeVisibilityButton(page, code, false)
    await assertCodeIsVisible(page, code, false)
    await navigate(page, '/admin-ui/va-code-values/')
    await assertCodeIsVisible(page, code, false)

    await clickCodeVisibilityButton(page, code, true)
    await assertCodeIsVisible(page, code, true)
    await navigate(page, '/admin-ui/va-code-values/')
    await assertCodeIsVisible(page, code, true)
  })

  it('hides a koodi from the dropdowns in haku editor', async function() {

    // create code
    await navigate(page, '/admin-ui/va-code-values/')
    const code = await createUniqueCode(page)
    await assertCodeIsVisible(page, code, true)

    // check code is visible in dropdown
    await navigate(page, '/admin/haku-editor/')
    await clearAndType(page, '[data-test-id=code-value-dropdown__operational-unit] > div', `${code}`)
    await page.waitForSelector(`[data-test-id="${code}"]`)

    // hide code
    await navigate(page, '/admin-ui/va-code-values/')
    await clickCodeVisibilityButton(page, code, false)
    await assertCodeIsVisible(page, code, false)
    await page.waitForSelector(`[data-test-id="${code}"]`)

    // check no results are found
    await navigate(page, '/admin/haku-editor/')
    await clearAndType(page, '[data-test-id=code-value-dropdown__operational-unit] > div', `${code}`)
    await page.waitForSelector('[data-test-id=code-value-dropdown__operational-unit] [data-test-id=code-value-dropdown__no-options]')
  })

  describe("Muutospäätösprosessi", () => {
    function createRandomHakuValues() {
      return {
        registerNumber: "230/2015",
        avustushakuName: `Testiavustushaku (Muutospäätösprosessi) ${randomString()} - ${moment(new Date()).format('YYYY-MM-DD hh:mm:ss:SSSS')}`
      }
    }

    const answers = {
      contactPersonEmail: "erkki.esimerkki@example.com",
      contactPersonName: "Erkki Esimerkki",
      contactPersonPhoneNumber: "666",
      projectName: "Rahassa kylpijät Ky Ay Oy",
    }

    const muutoshakemus1: MuutoshakemusValues = {
      jatkoaika: moment(new Date())
        .add(2, 'months')
        .add(1, 'days')
        .locale('fi'),
      jatkoaikaPerustelu: 'Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset'
    }

    const muutoshakemus2: MuutoshakemusValues = {
      jatkoaika: moment(new Date())
        .add(1, 'months')
        .add(3, 'days')
        .locale('fi'),
      jatkoaikaPerustelu: 'Kerkeehän sittenkin'
    }

    const muutoshakemus3: MuutoshakemusValues = {
      jatkoaika: moment(new Date())
        .add(4, 'months')
        .add(6, 'days')
        .locale('fi'),
      jatkoaikaPerustelu: 'Jaa ei kyllä kerkeekkään'
    }

    const muutoshakemus4: MuutoshakemusValues = {
      jatkoaika: moment(new Date())
        .add(3, 'months')
        .add(8, 'days')
        .locale('fi'),
      jatkoaikaPerustelu: 'Final muutoshakemus koira 2'
    }

    it("Avustushaun ratkaisu should send an email with link to muutoshakemus", async () => {
      const { avustushakuID, hakemusID } = await ratkaiseMuutoshakemusEnabledAvustushaku(page, createRandomHakuValues(), answers)

      const userKey = await getUserKey(avustushakuID, hakemusID)

      const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(avustushakuID, hakemusID)
      expect(linkToMuutoshakemus).toContain(`${HAKIJA_URL}/muutoshakemus?lang=fi&user-key=${userKey}&avustushaku-id=${avustushakuID}`)
    })

    it("Avustushaun ratkaisu should send an email without link to muutoshakemus if storing normalized hakemus fields is not possible", async () => {
      const { avustushakuID, hakemusID } = await ratkaiseAvustushaku(page)
      const emails = await waitUntilMinEmails(getMuutoshakemusEmails, 1, avustushakuID, hakemusID)
      emails.forEach(email => {
        expect(email.formatted).not.toContain(`${HAKIJA_URL}/muutoshakemus`)
      })
    })

    describe('Virkailija', () => {
      const haku = createRandomHakuValues()
      let avustushakuID: number
      let hakemusID: number

      beforeAll(async () => {
        const hakemusIdAvustushakuId = await ratkaiseMuutoshakemusEnabledAvustushaku(page, haku, answers)
        avustushakuID = hakemusIdAvustushakuId.avustushakuID
        hakemusID = hakemusIdAvustushakuId.hakemusID
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus1)
      })

      it('can see values of a new muutoshakemus', async () => {
        await navigate(page, `/avustushaku/${avustushakuID}/`)
        const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
        await page.waitForSelector(muutoshakemusStatusField)
        const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
        expect(muutoshakemusStatus).toEqual('☆ Uusi')
        await page.click(muutoshakemusStatusField)

        await page.waitForFunction(() => (document.querySelector('[data-test-id=number-of-pending-muutoshakemukset]') as HTMLInputElement).innerText === '1')
        const numOfMuutosHakemuksetElement = await page.waitForSelector('[data-test-id=number-of-pending-muutoshakemukset]', { visible: true })
        const color = await page.evaluate(e => getComputedStyle(e).color, numOfMuutosHakemuksetElement)
        expect(color).toBe('rgb(255, 0, 0)') // red

        await clickElement(page, 'span.muutoshakemus-tab')
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus1)
      }, 150 * 1000)

      it('can preview paatos of a new muutoshakemus', async () => {
        await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
        await clickElement(page, 'span.muutoshakemus-tab')
        await selectVakioperustelu(page)

        // accepted preview
        await clickElement(page, 'a.muutoshakemus__paatos-preview-link')
        await validateMuutoshakemusPaatosCommonValues(page)
        const acceptedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
        expect(acceptedPaatos).toEqual('Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.')
        await assertAcceptedPäätösHasVakioperustelu(page)
        await clickElement(page, 'button.hakemus-details-modal__close-button')

        // rejected preview
        await clickElement(page, 'label[for="rejected"]')
        await selectVakioperustelu(page)
        await clickElement(page, 'a.muutoshakemus__paatos-preview-link')
        await validateMuutoshakemusPaatosCommonValues(page)
        const rejectedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
        expect(rejectedPaatos).toEqual('Opetushallitus hylkää muutoshakemuksen.')
        await assertRejectedPäätösHasVakioperustelu(page)
      })

      async function assertAcceptedPäätösHasVakioperustelu(page: Page): Promise<void> {
        await assertPäätösHasPerustelu(page, 'Opetushallitus katsoo, että päätöksessä hyväksytyt muutokset tukevat hankkeen tavoitteiden saavuttamista.')
      }

      async function assertRejectedPäätösHasVakioperustelu(page: Page): Promise<void> {
        await assertPäätösHasPerustelu(page, 'Opetushallitus on arvioinut hakemuksen. Asiantuntija-arvioinnin perusteella on Opetushallitus asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.')
      }

      async function assertPäätösHasPerustelu(page: Page, perustelu: string): Promise<void> {
        const acceptedReason = await page.$eval('[data-test-id="paatos-reason"]', el => el.textContent)
        expect(acceptedReason).toEqual(perustelu)
      }

      it('gets an email with link to hakemus', async () => {
          const emails = await waitUntilMinEmails(getValmistelijaEmails, 1, avustushakuID, hakemusID)

          const title = emails[0]?.formatted.match(/Hanke:.*/)?.[0]
          expectToBeDefined(title)
          expect(title).toContain(`${haku.registerNumber} - ${answers.projectName}`)

          const linkToHakemus = await getLinkToHakemusFromSentEmails(avustushakuID, hakemusID)
          expect(linkToHakemus).toEqual(`${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
      })

      it('can reject a muutoshakemus', async () => {
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus1, { status: 'rejected'})

        await navigate(page, `/avustushaku/${avustushakuID}/`)
        const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
        await page.waitForSelector(muutoshakemusStatusField)
        const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
        expect(muutoshakemusStatus).toEqual('Hylätty')

        await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
        await clickElement(page, 'span.muutoshakemus-tab')
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus1, { status: 'rejected'})

        const paatosUrl = await page.$eval('a.muutoshakemus__paatos-link', el => el.textContent) || ''
        await page.goto(paatosUrl, { waitUntil: "networkidle0" })
        await validateMuutoshakemusPaatosCommonValues(page)
        const rejectedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
        expect(rejectedPaatos).toEqual('Opetushallitus hylkää muutoshakemuksen.')
        await assertRejectedPäätösHasVakioperustelu(page)
      })

      it('can accept a muutoshakemus', async () => {
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)

        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus4)
        await makePaatosForMuutoshakemusIfNotExists(page, 'accepted', avustushakuID, hakemusID)
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus4, { status: 'accepted'})

        const oldProjectEnd = await getElementInnerText(page, ".answer-old-value #project-end div")
        expect(oldProjectEnd).toEqual("20.04.4200")
        const newProjectEnd = await getElementInnerText(page, ".answer-new-value #project-end div")
        expect(newProjectEnd).toEqual(muutoshakemus4.jatkoaika?.format('DD.MM.YYYY'))

        await navigate(page, `/avustushaku/${avustushakuID}/`)
        const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
        await page.waitForSelector(muutoshakemusStatusField)
        const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
        expect(muutoshakemusStatus).toEqual('Hyväksytty')

        await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
        await clickElement(page, 'span.muutoshakemus-tab')
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus4, { status: 'accepted'})

        const paatosUrl = await page.$eval('a.muutoshakemus__paatos-link', el => el.textContent) || ''
        await page.goto(paatosUrl, { waitUntil: "networkidle0" })
        await validateMuutoshakemusPaatosCommonValues(page)
        const acceptedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
        expect(acceptedPaatos).toEqual('Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.')
        await assertAcceptedPäätösHasVakioperustelu(page)
      })

      it('can see values of multiple muutoshakemus', async () => {
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)

        // create two new muutoshakemus
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus2)
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus3)

        // assert newest muutoshakemus is new
        await navigate(page, `/avustushaku/${avustushakuID}/`)
        const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
        await page.waitForSelector(muutoshakemusStatusField)
        const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
        expect(muutoshakemusStatus).toEqual('☆ Uusi')

        // assert tabs work and data can be seen
        await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
        await page.waitForFunction(() => (document.querySelector('[data-test-id=number-of-pending-muutoshakemukset]') as HTMLInputElement).innerText === '4')
        await clickElement(page, 'span.muutoshakemus-tab')
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus3)
        expect(await getElementInnerText(page, '[data-test-id="project-end-date"]')).toBe(muutoshakemus4.jatkoaika?.format('DD.MM.YYYY'))

        await clickElement(page, 'button.muutoshakemus-tabs__tab:nth-child(2)')
        await validateMuutoshakemusValues(page, muutoshakemus2, { status: 'rejected' })
        expect(await getElementInnerText(page, '[data-test-id="project-end-date"]')).toBe(muutoshakemus4.jatkoaika?.format('DD.MM.YYYY'))

        await clickElement(page, 'button.muutoshakemus-tabs__tab:nth-child(3)')
        await validateMuutoshakemusValues(page, muutoshakemus4, { status: 'accepted' })
        expect(await getElementInnerText(page, '[data-test-id="project-end-date"]')).toBe('20.04.4200')

        await clickElement(page, 'button.muutoshakemus-tabs__tab:nth-child(4)')
        await validateMuutoshakemusValues(page, muutoshakemus1, { status: 'rejected' })
        expect(await getElementInnerText(page, '[data-test-id="project-end-date"]')).toBe('20.04.4200')

        expect(await getElementInnerText(page, '.answer-new-value #project-end')).toBe(muutoshakemus4.jatkoaika?.format('DD.MM.YYYY'))
      })

      it('hakija gets an email with link to paatos and link to new muutoshakemus', async () => {
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        const emails = await waitUntilMinEmails(getMuutoshakemusPaatosEmails, 1, avustushakuID, hakemusID)

        const title = emails[0]?.formatted.match(/Hanke:.*/)?.[0]
        expectToBeDefined(title)
        expect(title).toContain(`${haku.registerNumber} - ${answers.projectName}`)

        const linkToMuutoshakemusPaatosRegex = /https?:\/\/.*\/muutoshakemus\/paatos.*/
        const linkToMuutoshakemusPaatos = emails[0]?.formatted.match(linkToMuutoshakemusPaatosRegex)?.[0]
        expectToBeDefined(linkToMuutoshakemusPaatos)
        expect(linkToMuutoshakemusPaatos).toMatch(/https?:\/\/[^\/]+\/muutoshakemus\/paatos\?user-key=[a-f0-9]{64}/)

        const linkToMuutoshakemus = emails[0]?.formatted.match(linkToMuutoshakemusRegex)?.[0]
        expectToBeDefined(linkToMuutoshakemus)
        expect(linkToMuutoshakemus).toMatch(/https?:\/\/[^\/]+\/muutoshakemus\?.*/)
      })

      describe('When approving muutoshakemus with changed päättymispäivä', () => {

        beforeAll(async () => {
          await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
          const muutoshakemus = { ...muutoshakemus4, ...{ jatkoaikaPerustelu: 'Voit laittaa lisäaikaa ihan omantunnon mukaan.' }}
          await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus)

          await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
          await clickElement(page, 'span.muutoshakemus-tab')
          await page.click(`label[for="accepted_with_changes"]`)
          await setCalendarDate(page, '20.04.2400')
          await selectVakioperustelu(page)
        })

        it('Correct current project end date is displayed', async () => {
          const currentProjectEndDate = await getElementInnerText(page, '[data-test-id="current-project-end-date"]')
          expect(currentProjectEndDate).toBe(muutoshakemus4.jatkoaika?.format('DD.MM.YYYY'))
        })

        it('Correct applied change date is displayed', async () => {
          const appliedProjectEndDate = await getElementInnerText(page, '[data-test-id="approve-with-changes-muutoshakemus-jatkoaika"]')
          expect(appliedProjectEndDate).toBe(muutoshakemus4.jatkoaika?.format('DD.MM.YYYY'))
        })

        it('Correct päättymispäivä is displayed in päätös preview', async () => {
          await clickElement(page, 'a.muutoshakemus__paatos-preview-link')
          const acceptedDate = await page.$eval('[data-test-id="paattymispaiva-value"]', el => el.textContent)
          expect(acceptedDate).toBe('20.4.2400')
          await clickElement(page, 'button.hakemus-details-modal__close-button')
        })

        describe('After sending päätös', () => {
          beforeAll( async () => {
            await page.click('[data-test-id="muutoshakemus-submit"]:not([disabled])')
            await page.waitForSelector('[data-test-id="muutoshakemus-paatos"]')
          })

          it('Correct päättymispäivä is displayed to virkailija', async () => {
            const acceptedDate = await page.$eval('[data-test-id="muutoshakemus-jatkoaika"]', el => el.textContent)
            expect(acceptedDate).toBe('20.04.2400')
          })

          it('"Hyväksytty muutettuna" is displayed to virkailija', async () => {
            const paatosStatusText = await page.$eval('[data-test-id="paatos-status-text"]', el => el.textContent)
            expect(paatosStatusText).toBe('Hyväksytty muutettuna')
          })

          describe('When opening päätösdokumentti', () => {
            let paatosPage: Page

            beforeAll(async () => {
              const newPagePromise = new Promise<Page>(x => browser.once('targetcreated', target => x(target.page())))
              await clickElement(page, 'a.muutoshakemus__paatos-link')
              paatosPage = await newPagePromise
              await paatosPage.bringToFront()
            })

            it('Correct päättymispäivä is displayed', async () => {
              const acceptedDate = await textContent(paatosPage, '[data-test-id="paattymispaiva-value"]')
              expect(acceptedDate).toBe('20.4.2400')
            })

            it('Correct title is displayed', async () => {
              const paatos = await textContent(paatosPage, '[data-test-id="paatos-paatos"]')
              expect(paatos).toBe('Opetushallitus hyväksyy hakemuksen alla olevin muutoksin.')
            })

            afterAll(async () => {
              await page.bringToFront()
            })
          })

          it('Correct päättymispäivä is displayed when creating a new muutoshakemus', async () => {
            await navigateToHakijaMuutoshakemusPage(page, avustushakuID, hakemusID)
            const acceptedDate = await textContent(page, '[data-test-id="muutoshakemus-jatkoaika"]')
            expect(acceptedDate).toBe('20.04.2400')
          })

        })
      })
    })

    describe("Changing contact person details", () => {
      let linkToMuutoshakemus: string
      let avustushakuID: number
      let hakemusID: number
      const newName = randomString()
      const newEmail = "uusi.email@reaktor.com"
      const newPhone = "0901967632"
      const haku = createRandomHakuValues()

      beforeAll(async () => {
        const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseMuutoshakemusEnabledAvustushaku(page, haku, answers)
        avustushakuID = avustushakuId
        hakemusID = hakemusId
        linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(avustushakuID, hakemusID)
      })

      it("should show avustushaku name, project name, and registration number as well as name, email and phone number for contact person", async () => {

        expectToBeDefined(linkToMuutoshakemus)
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
        const avustushakuNameSpan = await page.waitForSelector("[data-test-id=avustushaku-name]", { visible: true })
        const avustushakuName = await page.evaluate(element => element.textContent, avustushakuNameSpan)

        const projectNameDiv = await page.waitForSelector("[data-test-id=project-name]", { visible: true })
        const projectName = await page.evaluate(element => element.textContent, projectNameDiv)

        const registerNumberSpan = await page.waitForSelector("[data-test-id=register-number]", { visible: true })
        const registerNumber = await page.evaluate(element => element.textContent, registerNumberSpan)

        const contactPersonInput = await page.waitForSelector("#muutoshakemus__contact-person", { visible: true })
        const contactPerson = await page.evaluate(element => element.value, contactPersonInput)

        const contactPersonEmailInput = await page.waitForSelector("#muutoshakemus__email", { visible: true })
        const contactPersonEmail = await page.evaluate(element => element.value, contactPersonEmailInput)

        const contactPersonPhoneInput = await page.waitForSelector("#muutoshakemus__phone", { visible: true })
        const contactPersonPhoneNumber = await page.evaluate(element => element.value, contactPersonPhoneInput)

        expect(avustushakuName).toEqual(haku.avustushakuName)
        expect(projectName).toEqual(answers.projectName)
        expect(registerNumber).toEqual(haku.registerNumber)
        expect(contactPerson).toEqual(answers.contactPersonName)
        expect(contactPersonEmail).toEqual(answers.contactPersonEmail)
        expect(contactPersonPhoneNumber).toEqual(answers.contactPersonPhoneNumber)
      })

      it("should show original hakemus", async() => {
        expectToBeDefined(linkToMuutoshakemus)
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
        const iframe = await page.waitForSelector("iframe[data-test-id=original-hakemus]")
        if (!iframe) throw Error("Original hakemus iframe not found on page :mad:")
        const frameContent = await iframe.contentFrame()
        if (!frameContent) throw Error("Original hakemus frameContent not found on page :mad:")

        expect(await getElementInnerText(frameContent, "[id='signatories-fieldset-1.name']"))
          .toStrictEqual(answers.contactPersonName)
        expect(await getElementInnerText(frameContent, "#business-id"))
          .toStrictEqual(TEST_Y_TUNNUS)
      })

      it("Save button deactivates when contact person email does not validate", async () => {
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })

        await page.waitForSelector("#send-muutospyynto-button", { visible: true })

        const sendMuutospyyntoButtonIsDisabled = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabled).toBeTruthy()

        await clearAndType(page, '#muutoshakemus__contact-person', newName)
        await clearAndType(page, '#muutoshakemus__email', "not-email")
        await clearAndType(page, '#muutoshakemus__phone', newPhone)

        const sendMuutospyyntoButtonIsDisabledAfterInvalidEmail = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabledAfterInvalidEmail).toBeTruthy()

        const emailInputFieldClassWhenInvalidEmail = await getElementAttribute(page, "#muutoshakemus__email", "class")
        expectToBeDefined(emailInputFieldClassWhenInvalidEmail)
        expect(emailInputFieldClassWhenInvalidEmail).toContain("error")

        await clearAndType(page, '#muutoshakemus__email', newEmail)

        const sendMuutospyyntoButtonIsDisabledAfterChange = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabledAfterChange).toBeFalsy()

        const emailInputFieldClassWithValidEmail = await getElementAttribute(page, "#muutoshakemus__email", "class")
        expect(emailInputFieldClassWithValidEmail).toBeFalsy()
      })


      it("Save button activates when contact person details are changed", async () => {
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })

        await page.waitForSelector("#send-muutospyynto-button", { visible: true })

        const sendMuutospyyntoButtonIsDisabled = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabled).toBeTruthy()

        await clearAndType(page, '#muutoshakemus__contact-person', newName)
        await clearAndType(page, '#muutoshakemus__email', newEmail)
        await clearAndType(page, '#muutoshakemus__phone', newPhone)

        const sendMuutospyyntoButtonIsDisabledAfterChange = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabledAfterChange).toBeFalsy()

        await clickElement(page, "#send-muutospyynto-button")
      })

      it("Changed contact person details are shown for virkailija", async () => {
        await navigate(page, `/avustushaku/${avustushakuID}/`)
        await Promise.all([
          page.waitForNavigation(),
          clickElementWithText(page, "td", "Akaan kaupunki"),
        ])
        await page.waitForSelector('.answer-old-value #applicant-name div')
        const oldContactPersonNameOnPage = await getElementInnerText(page, ".answer-old-value #applicant-name div")
        expect(oldContactPersonNameOnPage).toEqual("Erkki Esimerkki")
        const contactPersonNameOnPage = await getElementInnerText(page, ".answer-new-value #applicant-name div")
        expect(contactPersonNameOnPage).toEqual(newName)
        const oldContactPersonPhoneOnPage = await getElementInnerText(page, ".answer-old-value #textField-0 div")
        expect(oldContactPersonPhoneOnPage).toEqual("666")
        const contactPersonPhoneOnPage = await getElementInnerText(page, ".answer-new-value #textField-0 div")
        expect(contactPersonPhoneOnPage).toEqual(newPhone)
        const oldContactPersonEmailOnPage = await getElementInnerText(page, ".answer-old-value #primary-email div")
        expect(oldContactPersonEmailOnPage).toEqual("erkki.esimerkki@example.com")
        const contactPersonEmailOnPage = await getElementInnerText(page, ".answer-new-value #primary-email div")
        expect(contactPersonEmailOnPage).toEqual(newEmail)
      })

      it('Re-sending paatos doesn\'t override changed contact person details', async () => {
        await navigate(page, `/avustushaku/${avustushakuID}/`)
        await Promise.all([
          page.waitForNavigation(),
          clickElementWithText(page, "td", "Akaan kaupunki"),
        ])
        await page.waitForSelector('.answer-old-value #applicant-name div')
        const oldNameOnPage = await getElementInnerText(page, ".answer-old-value #applicant-name div")
        const nameOnPage = await getElementInnerText(page, ".answer-new-value #applicant-name div")
        const oldPhoneOnPage = await getElementInnerText(page, ".answer-old-value #textField-0 div")
        const phoneOnPage = await getElementInnerText(page, ".answer-new-value #textField-0 div")
        const oldEmailOnPage = await getElementInnerText(page, ".answer-old-value #primary-email div")
        const emailOnPage = await getElementInnerText(page, ".answer-new-value #primary-email div")

        page.on('dialog', async dialog => { dialog.accept() })
        await page.click('[data-test-id=resend-paatos]')
        await page.waitForSelector('[data-test-id=paatos-resent]')

        // reload to see possibly changed values
        await navigate(page, `/avustushaku/${avustushakuID}/`)
        await Promise.all([
          page.waitForNavigation(),
          clickElementWithText(page, "td", "Akaan kaupunki"),
        ])
        await page.waitForSelector('.answer-old-value #applicant-name div')
        expect(await getElementInnerText(page, ".answer-old-value #applicant-name div")).toEqual(oldNameOnPage)
        expect(await getElementInnerText(page, ".answer-new-value #applicant-name div")).toEqual(nameOnPage)
        expect(await getElementInnerText(page, ".answer-old-value #textField-0 div")).toEqual(oldPhoneOnPage)
        expect(await getElementInnerText(page, ".answer-new-value #textField-0 div")).toEqual(phoneOnPage)
        expect(await getElementInnerText(page, ".answer-old-value #primary-email div")).toEqual(oldEmailOnPage)
        expect(await getElementInnerText(page, ".answer-new-value #primary-email div")).toEqual(emailOnPage)
      })

      it('shows existing muutoshakemuses', async () => {
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus1)
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus2)
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus3)

        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
        const muutoshakemuses = await page.$$('[data-test-class="existing-muutoshakemus"]')
        expect(muutoshakemuses.length).toEqual(3)

        const firstTitle = await muutoshakemuses[0].$eval('.muutoshakemus__title', el => el.textContent)
        expect(firstTitle).toContain('- Odottaa käsittelyä')
        expect(await countElements(page, `span.muutoshakemus__paatos-icon--rejected`)).toEqual(2)
      })

      it('printable version shows new values', async () => {
        await navigate(page, `/avustushaku/${avustushakuID}/`)
        await Promise.all([
          page.waitForNavigation(),
          clickElementWithText(page, "td", "Akaan kaupunki"),
        ])

        await page.waitForSelector('[data-test-id="hakemus-printable-link"]')
        const printableVersionTab = new Promise(x => browser.once('targetcreated', target => x(target.page()))) as Promise<Page>
        await page.click('[data-test-id="hakemus-printable-link"]')

        const printablePage = await printableVersionTab
        await printablePage.waitForSelector('#applicant-name div')
        expect(await getElementInnerText(printablePage, "#applicant-name div")).toEqual(newName)
        expect(await getElementInnerText(printablePage, "#primary-email div")).toEqual(newEmail)
        expect(await getElementInnerText(printablePage, "#textField-0 div")).toEqual(newPhone)
        printablePage.close()
      })
    })
  })

  describe.skip("Standardized avustushaku", () => {
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
