import axios from 'axios'
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
  publishAvustushaku,
  fillAndSendHakemus,
  acceptHakemus,
  clickCodeVisibilityButton,
  clickElementWithTestId,
  assertCodeIsVisible,
  expectedResponseFromExternalAPIhakemuksetForAvustushaku,
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
  fillAndSendVäliselvityspyyntö,
  downloadExcelExport,
  clickFormSaveAndWait,
  addFieldToFormAndReturnElementIdAndLabel,
  TEST_Y_TUNNUS,
  navigateToHakemuksenArviointi,
  getTäydennyspyyntöEmails,
  waitUntilMinEmails,
  setPageErrorConsoleLogger,
  randomString,
  log,
  navigateToHakemus,
  countElements,
  getElementInnerText,
  navigateToPaatos,
  lastOrFail,
  navigateToSeurantaTab,
  clickDropdownElementWithText,
  selectMaakuntaFromDropdown,
  fillTäydennyspyyntöField,
  clickToSendTäydennyspyyntö,
  resendPäätökset,
  changeContactPersonEmail,
  randomAsiatunnus,
  setupTestLogging,
} from './test-util'
import {
  createAndPublishMuutoshakemusDisabledMenoluokiteltuHaku,
  fillAndSendMuutoshakemusDisabledMenoluokiteltuHakemus,
  publishAndFillMuutoshakemusEnabledAvustushaku,
  ratkaiseMuutoshakemusEnabledAvustushaku,
  getLinkToMuutoshakemusFromSentEmails,
} from './muutoshakemus/muutospaatosprosessi-util'
import {
  navigateToHakijaMuutoshakemusPage,
} from './muutoshakemus/muutoshakemus-util'

jest.setTimeout(400_000)

describe("Puppeteer tests", () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)
  })

  setupTestLogging()

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  it("should allow removing attachment from hakemus", async function() {
    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())

    await publishAvustushaku(page)
    await fillAndSendHakemus(page, avustushakuID, async function() {
      await deleteAttachment(page, "financial-information-form")
      await uploadFile(page, "input[name='financial-information-form']", dummyPdfPath)
    })
  })

  describe("should allow basic avustushaku flow and check each hakemus has valmistelija", () => {
    const allowBasicAvustushakuFlowAndCheckEachHakemusHasValmistelija = (getPage: () => Page, multiplePaymentBatches: boolean) => async () => {
      const page = getPage()
      const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())

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
      const logEntryCount = await tapahtumaloki?.evaluate(e => e.querySelectorAll(".entry").length)
      expect(logEntryCount).toEqual(1)
    }

    it("when the avustushaku has a single payment batch", allowBasicAvustushakuFlowAndCheckEachHakemusHasValmistelija(() => page, false))
    it("when the avustushaku has multiple payment batches", allowBasicAvustushakuFlowAndCheckEachHakemusHasValmistelija(() => page, true))
  })

  it("shows the same updated date on the Päätös tab as on the Väliselvitys and Loppuselvitys tabs", async function() {

    await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())

    await clickElementWithText(page, "span", "Päätös")
    const paatosUpdatedAt = getElementInnerText(page, "#paatosUpdatedAt")

    await clickElementWithText(page, "span", "Väliselvitys")
    const valiselvitysUpdatedAt = getElementInnerText(page, "#valiselvitysUpdatedAt")

    await clickElementWithText(page, "span", "Loppuselvitys")
    const loppuselvitysUpdatedAt = getElementInnerText(page, "#loppuselvitysUpdatedAt")

    return Promise.all([paatosUpdatedAt, valiselvitysUpdatedAt, loppuselvitysUpdatedAt])
      .then(([paatos, valiselvitys, loppuselvitys]) => {
        expect(paatos).toEqual(valiselvitys)
        expect(paatos).toEqual(loppuselvitys)
      })
  })

  describe('When virkailija creates avustushaku', () => {
    let originalPaatosTimestamp: string
    let originalValiselvitysTimestamp: string
    let originalLoppuselvitysTimestamp: string
    let avustushakuId: number

    beforeAll(async () => {
      avustushakuId = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())
      await clickElementWithText(page, "span", "Päätös")
      originalPaatosTimestamp = await textContent(page, "#paatosUpdatedAt")

      await clickElementWithText(page, "span", "Väliselvitys")
      originalValiselvitysTimestamp = await textContent(page, "#valiselvitysUpdatedAt")

      await clickElementWithText(page, "span", "Loppuselvitys")
      originalLoppuselvitysTimestamp = await textContent(page, "#loppuselvitysUpdatedAt")
    })


    describe('And modifies päätös', () => {
      beforeAll(async () => {
        await clickElementWithText(page, "span", "Päätös")
        await clearAndType(page, "#decision\\.taustaa\\.fi", "Burger Time")
        await waitForSave(page)
      })

      it('päätös modified timestamp has changed', async () => {
        expect(await textContent(page, "#paatosUpdatedAt")).not.toEqual(originalPaatosTimestamp)
      })

      describe('And navigates to loppuselvitys', () => {
        beforeAll(async () => {
          await clickElementWithText(page, "span", "Loppuselvitys")
        })

        it('loppuselvitys modified timestamp has not changed', async () => {
          expect(await textContent(page, "#loppuselvitysUpdatedAt")).toEqual(originalLoppuselvitysTimestamp)
        })
      })

      describe('And navigates to väliselvitys', () => {
        beforeAll(async () => {
          await clickElementWithText(page, "span", "Väliselvitys")
        })

        it('väliselvitys modified timestamp has not changed', async () => {
          expect(await textContent(page, "#valiselvitysUpdatedAt")).toEqual(originalValiselvitysTimestamp)
        })
      })
    })

    describe('changes väliselvitys and loppuselvitys values and creates a copy of the avustushaku', () => {
      beforeAll(async () => {
        await clickElement(page, '[data-test-id="väliselvitys-välilehti"]')
        await clearAndType(page, '[name="applicant-info-label-fi"]', 'Muokattu väliselvitys')
        await clickElementWithText(page, 'button', 'Tallenna')

        await waitForElementWithText(page, 'span', 'Loppuselvitys')
        await clickElement(page, '[data-test-id="loppuselvitys-välilehti"]')
        await clearAndType(page, '[name="applicant-info-label-fi"]', 'Muokattu loppuselvitys')
        await clickElementWithText(page, 'button', 'Tallenna')

        await clickElement(page, '[data-test-id="haun-tiedot-välilehti"]')
        await clickElement(page, '#create-haku')
      })

      it('väliselvitys and loppuselvitys are copied to the new avustushaku', async () => {
        await clickElement(page, '[data-test-id="väliselvitys-välilehti"]')
        await page.waitForSelector('#valiselvitysUpdatedAt')
        expect(await textContent(page, '[name="applicant-info-label-fi"]')).toEqual('Muokattu väliselvitys')

        await clickElement(page, '[data-test-id="loppuselvitys-välilehti"]')
        await page.waitForSelector('#loppuselvitysUpdatedAt')
        expect(await textContent(page, '[name="applicant-info-label-fi"]')).toEqual('Muokattu loppuselvitys')
      })

      it('changing väliselvitys and loppuselvitys on the copied avustushaku does not change the original selvitys values', async () => {
        await clickElement(page, '[data-test-id="väliselvitys-välilehti"]')
        await page.waitForSelector('#valiselvitysUpdatedAt')
        await clearAndType(page, '[name="applicant-info-label-fi"]', 'Uudelleen muokattu väliselvitys')
        await clickElementWithText(page, 'button', 'Tallenna')

        await waitForElementWithText(page, 'span', 'Loppuselvitys')
        await clickElement(page, '[data-test-id="loppuselvitys-välilehti"]')
        await page.waitForSelector('#loppuselvitysUpdatedAt')
        await clearAndType(page, '[name="applicant-info-label-fi"]', 'Uudelleen muokattu loppuselvitys')
        await clickElementWithText(page, 'button', 'Tallenna')

        await navigate(page, `/admin/valiselvitys/?avustushaku=${avustushakuId}`)
        await page.waitForSelector('#valiselvitysUpdatedAt')
        expect(await textContent(page, '[name="applicant-info-label-fi"]')).toEqual('Muokattu väliselvitys')

        await clickElement(page, '[data-test-id="loppuselvitys-välilehti"]')
        await page.waitForSelector('#loppuselvitysUpdatedAt')
        expect(await textContent(page, '[name="applicant-info-label-fi"]')).toEqual('Muokattu loppuselvitys')
      })
    })
  })

  it("supports fields that accept only decimals", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())
    const { fieldId, fieldLabel } = await addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page, "decimalField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page)

    await fillAndSendHakemus(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectValidationError(page, fieldId, 'Not an decimal', fieldLabel, 'fi: Syötä yksi numeroarvo')
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, '4.2')
    })
  })

  it("supports fields that accept only whole numbers", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())
    const { fieldId, fieldLabel } = await addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page, "integerField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page)

    await fillAndSendHakemus(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectValidationError(page, fieldId, 'Not an integer', fieldLabel, 'fi: Syötä arvo kokonaislukuina')
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, '420')
    })
  })

  it("supports editing and saving the values of the fields", async function() {

    await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())
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

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())
    await navigate(page, `/admin/form-editor/?avustushaku=${avustushakuID}`)
    // Add new Koodistokenttä
    await page.hover(".soresu-field-add-header")
    await clickElementWithText(page, "a", "Koodistokenttä")
    const inputfield = await clickElementWithText(page, 'span', 'Valitse koodisto')
    const inputWidth =  await page.evaluate(e => e.offsetWidth, inputfield)
    expect(inputWidth).toBeGreaterThanOrEqual(200)
    await inputfield?.type('ammattil')
    // Select koodisto for the field
    await clickDropdownElementWithText(page, 'ammattiluokitus')
    // Select input type for the field
    await clickElementWithText(page, "label", "Pudotusvalikko")

    await clickFormSaveAndWait(page)
  })

  describe('When haku #1 has been created and published', () => {
    let fieldId: string
    let avustushakuID: number
    let hakemusID: number
    const randomValueForProjectNutshell = randomString()

    beforeAll(async () => {
      avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())
      fieldId = (await addFieldToFormAndReturnElementIdAndLabel(page, "project-goals", "textField")).fieldId

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
            await navigateToPaatos(page, hakemusID)
            await page.waitForXPath("//h2[contains(text(), 'Avustuksen käyttöaika')]")
            const firstDay = await page.$x("//p[contains(text(), 'Avustuksen ensimmäinen käyttöpäivä 20.04.1969')]")
            expect(firstDay.length).toEqual(1)
            const lastDay = await page.$x("//p[contains(text(), 'Avustuksen viimeinen käyttöpäivä 20.04.4200')]")
            expect(lastDay.length).toEqual(1)
          })

          describe('when väliselvityspyyntö is sent', () => {
            beforeAll(async () => {
              await navigate(page, `/admin/valiselvitys/?avustushaku=${avustushakuID}`)
              await clickElement(page, '[data-test-id=send-valiselvitys]')
            })

            it('shows the väliselvitys log', async () => {
              await navigate(page, `/admin/valiselvitys/?avustushaku=${avustushakuID}`)
              await page.waitForSelector('div.tapahtumaloki')
              const sender = await textContent(page, '[data-test-id="sender-0"]')
              expect(sender).toEqual('_ valtionavustus')
              const sent = await textContent(page, '[data-test-id="sent-0"]')
              expect(sent).toEqual('1')
            })

            it('shows väliselvitys as missing on Hakemusten arviointi view', async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/`)
              expect(await textContent(page, `#hakemus-${hakemusID} [data-test-id="väliselvitys-column"]`))
                .toEqual('Puuttuu')
            })
          })

          describe('when loppuselvityspyyntö is sent', () => {
            beforeAll(async () => {
              await navigate(page, `/admin/loppuselvitys/?avustushaku=${avustushakuID}`)
              await clickElement(page, '[data-test-id=send-loppuselvitys]')
            })

            it('shows the loppuselvitys log', async () => {
              await navigate(page, `/admin/loppuselvitys/?avustushaku=${avustushakuID}`)
              await page.waitForSelector('div.tapahtumaloki')
              const sender = await textContent(page, '[data-test-id="sender-0"]')
              expect(sender).toEqual('_ valtionavustus')
              const sent = await textContent(page, '[data-test-id="sent-0"]')
              expect(sent).toEqual('1')
            })

            it('shows loppuselvitys as missing on Hakemusten arviointi view', async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/`)
              expect(await textContent(page, `#hakemus-${hakemusID} [data-test-id="loppuselvitys-column"]`))
                .toEqual('Puuttuu')
            })
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
      avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus())
      fieldId = (await addFieldToFormAndReturnElementIdAndLabel(page, "project-nutshell", "textField")).fieldId

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

  describe('When muutoshakukelvoton avustushaku with menoluokat has been created', () => {
    let avustushakuID: number
    let hakemusID: number
    const haku = {
      registerNumber: randomAsiatunnus(),
      avustushakuName: `Muutoshakukelvoton menoluokallinen haku - ${moment(new Date()).format('YYYY-MM-DD HH:mm:ss:SSSS')}`
    }

    beforeAll(async () => {
      avustushakuID = await createAndPublishMuutoshakemusDisabledMenoluokiteltuHaku(page, haku)
    })

    describe('And menoluokallinen hakemus has been submitted', () => {
      const answers = {
        contactPersonEmail: "aku.ankka@example.com",
        contactPersonName: "Aku Ankka",
        contactPersonPhoneNumber: "313",
        projectName: "Akuutin budjettivajeen jeesaus",
      }
      beforeAll(async () => {
        hakemusID = await fillAndSendMuutoshakemusDisabledMenoluokiteltuHakemus(page, avustushakuID, answers)
      })

      describe('And hakemus has been approved with lump sum and päätös has been sent', () => {
        beforeAll(async () => {
          await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
          await acceptHakemus(page, avustushakuID, hakemusID, async () => {})
          await sendPäätös(page, avustushakuID)
        })

        describe('And virkailija navigates to seuranta', () => {
          beforeAll(async () => {
            await navigateToSeurantaTab(page, avustushakuID, hakemusID)
          })

          it('total myönnetty amount is displayed correctly', async () => {
            expect(await getElementInnerText(page, '#budget-edit-project-budget [class="granted-amount-column"] [class="money"]'))
              .toBe('100000')
          })

          it('OPH:n hyväksymä amount is displayed correctly', async () => {
            expect(await getElementInnerText(page, '#budget-edit-project-budget [class="amount-column"] [class="money sum"]'))
              .toBe('0')
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

    expect(await getTäydennyspyyntöEmails(hakemusID)).toHaveLength(0)

    const täydennyspyyntöText = "Joo ei tosta hakemuksesta ota mitään tolkkua. Voisitko tarkentaa?"
    await fillTäydennyspyyntöField(page, täydennyspyyntöText)
    await clickToSendTäydennyspyyntö(page, avustushakuID, hakemusID)

    expect(await textContent(page, "#arviointi-tab .change-request-title"))
      .toMatch(/\* Täydennyspyyntö lähetetty \d{1,2}\.\d{1,2}\.\d{4} \d{1,2}\.\d{1,2}/)
    // The quotes around täydennyspyyntö message are done with CSS :before
    // and :after pseudo elements and not shown in Node.textContent
    expect(await textContent(page, "#arviointi-tab .change-request-text"))
      .toStrictEqual(täydennyspyyntöText)

    const emails = await waitUntilMinEmails(getTäydennyspyyntöEmails, 1, hakemusID)
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
    const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(hakemusID)

    let emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    let email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "yrjo.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])

    await resendPäätökset(page, avustushakuID)
    emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 2, hakemusID)
    expect(emails).toHaveLength(2)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "yrjo.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])

    await changeContactPersonEmail(page, linkToMuutoshakemus, "uusi.yhteyshenkilo@example.com")
    await resendPäätökset(page, avustushakuID)

    emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 3, hakemusID)
    expect(emails).toHaveLength(3)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "uusi.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])

    await navigate(page, `/admin/valiselvitys/?avustushaku=${avustushakuID}`)
    await clickElement(page, '[data-test-id=send-valiselvitys]')

    emails = await waitUntilMinEmails(getValiselvitysEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "uusi.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])
    expect(email.bcc).toEqual("santeri.horttanainen@reaktor.com")

    await navigate(page, `/admin/loppuselvitys/?avustushaku=${avustushakuID}`)
    await clickElement(page, '[data-test-id=send-loppuselvitys]')

    emails = await waitUntilMinEmails(getLoppuselvitysEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "uusi.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])
    expect(email.bcc).toEqual("santeri.horttanainen@reaktor.com")
  })

  describe('When virkailija navigates to codes page', () => {
    beforeAll(async () => {
      await navigate(page, '/admin-ui/va-code-values/')
    })

    describe('And creates new koodi', () => {
      let code: string
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
      const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, randomAsiatunnus(), "standardized avustushaku")
      await clickElementWithText(page, "span", "Hakulomake")
      await clearAndSet(page, ".form-json-editor textarea", standardizedHakulomakeJson)
      await clickFormSaveAndWait(page)

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
      await selectMaakuntaFromDropdown(page, "Kainuu")

      const iban = "FI95 6682 9530 0087 65";
      await clearAndType(page, "#bank-iban", iban)
      const bic = "OKOYFIHH";
      await clearAndType(page, "#bank-bic", bic)

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
      await navigateToHakijaMuutoshakemusPage(page, hakemusID)
    })
  })
})
