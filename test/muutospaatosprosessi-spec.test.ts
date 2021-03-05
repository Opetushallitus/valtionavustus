import {Browser, Page} from 'puppeteer'
import moment from 'moment'

import {
  VIRKAILIJA_URL,
  getMuutoshakemusEmails,
  getMuutoshakemusPaatosEmails,
  getValmistelijaEmails,
  HAKIJA_URL,
  linkToMuutoshakemusRegex,
  TEST_Y_TUNNUS,
  clearAndType,
  clickElement,
  clickElementWithText,
  countElements,
  expectToBeDefined,
  fillAndSendMuutoshakemus,
  getElementAttribute,
  getElementInnerText,
  getFirstPage,
  getLinkToHakemusFromSentEmails,
  getLinkToMuutoshakemusFromSentEmails,
  getUserKey,
  hasElementAttribute,
  log,
  makePaatosForMuutoshakemusIfNotExists,
  mkBrowser,
  navigate,
  navigateToHakijaMuutoshakemusPage,
  randomString,
  ratkaiseAvustushaku,
  ratkaiseMuutoshakemusEnabledAvustushaku,
  selectVakioperustelu,
  setCalendarDate,
  setPageErrorConsoleLogger,
  textContent,
  validateMuutoshakemusPaatosCommonValues,
  validateMuutoshakemusValues,
  waitUntilMinEmails,
  MuutoshakemusValues,
} from './test-util'

jest.setTimeout(400_000)

describe('Muutospäätösprosessi', () => {
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

})
