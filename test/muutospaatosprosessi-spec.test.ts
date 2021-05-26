import {Browser, ElementHandle, Frame, Page} from 'puppeteer'
import moment from 'moment'

import {
  VIRKAILIJA_URL,
  getValmistelijaEmails,
  getAcceptedPäätösEmails,
  HAKIJA_URL,
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
  navigateToHakemus,
  navigateToHakijaMuutoshakemusPage,
  randomString,
  ratkaiseAvustushaku,
  ratkaiseMuutoshakemusEnabledAvustushaku,
  selectVakioperusteluInFinnish,
  setPageErrorConsoleLogger,
  textContent,
  validateMuutoshakemusPaatosCommonValues,
  validateMuutoshakemusValues,
  waitUntilMinEmails,
  MuutoshakemusValues,
  Email,
  createHakuFromEsimerkkihaku,
  fillMuutoshakemusPaatosWithVakioperustelu,
  fillAndSendMuutoshakemusDecision,
  defaultBudget,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
  parseMuutoshakemusPaatosFromEmails,
  acceptAvustushaku,
  createMuutoshakemusEnabledAvustushakuAndFillHakemus,
  markAvustushakuAsMuutoshakukelvoton,
  lastOrFail,
  getHakemusTokenAndRegisterNumber,
  navigateToHakemuksenArviointi,
  waitForElementWithText,
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
      .add(3, 'months')
      .add(8, 'days')
      .locale('fi'),
    jatkoaikaPerustelu: 'Final muutoshakemus koira 2'
  }

  const muutoshakemus3: MuutoshakemusValues = {
    jatkoaika: moment(new Date())
      .add(1, 'months')
      .add(3, 'days')
      .locale('fi'),
    jatkoaikaPerustelu: 'Kerkeehän sittenkin'
  }

  const muutoshakemus4: MuutoshakemusValues = {
    jatkoaika: moment(new Date())
      .add(4, 'months')
      .add(6, 'days')
      .locale('fi'),
    jatkoaikaPerustelu: 'Jaa ei kyllä kerkeekkään'
  }



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

  describe('When haku has been published and hakemus has been submitted, but fields cannot be normalized', () => {
    let emails: Email[]
    beforeAll(async () => {
      const { hakemusID } = await ratkaiseAvustushaku(page)
      emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
    })

    it('Hakija does not get email to muutoshakemus', () => {
      emails.forEach(email => {
        expect(email.formatted).not.toContain(`${HAKIJA_URL}/muutoshakemus`)
      })
    })
  })

  describe('When avustushaku is marked as muutoshakukelvoton', function () {
    const haku = createRandomHakuValues()
    let avustushakuID: number
    let hakemusID: number
    let userKey: string

    beforeAll(async () => {
      const { avustushakuID: aid, userKey: uk } = await createMuutoshakemusEnabledAvustushakuAndFillHakemus(page, haku, answers)
      avustushakuID = aid
      userKey = uk
      await markAvustushakuAsMuutoshakukelvoton(avustushakuID)
      const { hakemusID: hid } = await acceptAvustushaku(page, avustushakuID)
      hakemusID = hid
    })

    it('shows warning on Haun tiedot tab', async () => {
      await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
      expect(await textContent(page, '[data-test-id="muutoshakukelvoton-warning"]')).toEqual(
        'Huom.! Uusi muutoshakutoiminnallisuus ei ole käytössä tälle avustushaulle.' +
        'Avustushaun päätöksiin ei tule linkkiä uudelle muutoshakusivulle' +
        'Uusi muutoshakutoiminnallisuus ei ole käytössä tästä avustushausta luoduille kopioille'
      )
    })

    it('does not send link to muutoshaku page with päätös', async () => {
      const { token, 'register-number': registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
      const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
      const email = lastOrFail(emails)
      expect(email.formatted).toEqual( `${registerNumber} - ${answers.projectName}

${haku.avustushakuName}

Avustuspäätöstä voitte tarkastella tästä linkistä: ${HAKIJA_URL}/paatos/avustushaku/${avustushakuID}/hakemus/${userKey}

Avustuksen saajan tulee noudattaa avustuspäätöksessä sekä sen liitteissä kuvattuja ehtoja ja rajoituksia.

Mikäli otatte päätöksen mukaisen avustuksen vastaan, voitte käynnistää hankkeen. Avustussumma maksetaan päätöksessä ilmoitettuun päivämäärään mennessä.

Mikäli ette ota päätöksen mukaista avustusta vastaan, tulee siitä ilmoittaa Opetushallitukselle päätöksessä mainittuun päivämäärään mennessä. Ilmoitus asiasta tehdään valtionavustusjärjestelmään tästä linkistä: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?avustushaku=${avustushakuID}&hakemus=${userKey}&lang=fi&preview=true&token=${token}&refuse-grant=true&modify-application=false

Avustuksen saaja vastaa siitä, että valtionavustusjärjestelmään kirjatut yhteyshenkilön yhteystiedot ovat aina ajan tasalla. Yhteyshenkilö vaihdetaan oheisen linkin kautta, joka on käytettävissä läpi avustuksen käyttöajan:

${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?avustushaku=${avustushakuID}&hakemus=${userKey}&lang=fi&preview=false&token=${token}&refuse-grant=false&modify-application=true

Selvityspyynnöt sekä muut valtionavustusjärjestelmästä hankkeille osoitetut viestit saapuvat osoitteesta no-reply@valtionavustukset.oph.fi, ja ne lähetetään sekä hankkeen yhteyshenkilölle että hakijan ilmoittamaan viralliseen sähköpostiosoitteeseen.

Avustuksen saajan tulee säilyttää tämä viesti sekä viestin sisältämät linkit.

Tarvittaessa tarkempia lisätietoja antaa avustuspäätöksessä nimetty lisätietojen antaja.



Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki
puhelin 029 533 1000
etunimi.sukunimi@oph.fi`)
    })

    it('navigates to the old virkailija edit view', async () => {
      await navigateToHakemuksenArviointi(page, avustushakuID, answers.projectName)
      await clickElementWithText(page, 'button', 'Muokkaa hakemusta')
      await page.type('[data-test-id="virkailija-edit-comment"]', 'Kuhan tässä nyt muokkaillaan')

      const newPagePromise = waitForNewTabToOpen(browser)
      await clickElementWithText(page, 'button', 'Siirry muokkaamaan')
      const modificationPage = await newPagePromise

      await modificationPage.bringToFront()
      expect(await modificationPage.evaluate(() => window.location.href))
        .toEqual(`${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=${userKey}`)
      await page.bringToFront()
    })

    it('does not show link to muutoshaku in email preview', async () => {
      await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
      expect(await textContent(page, '.decision-email-content'))
        .toEqual(` - 

${haku.avustushakuName}

Avustuspäätöstä voitte tarkastella tästä linkistä: ${HAKIJA_URL}/paatos/avustushaku/${avustushakuID}/hakemus/

Avustuksen saajan tulee noudattaa avustuspäätöksessä sekä sen liitteissä kuvattuja ehtoja ja rajoituksia.

Mikäli otatte päätöksen mukaisen avustuksen vastaan, voitte käynnistää hankkeen. Avustussumma maksetaan päätöksessä ilmoitettuun päivämäärään mennessä.

Mikäli ette ota päätöksen mukaista avustusta vastaan, tulee siitä ilmoittaa Opetushallitukselle päätöksessä mainittuun päivämäärään mennessä. Ilmoitus asiasta tehdään valtionavustusjärjestelmään tästä linkistä: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?avustushaku=${avustushakuID}&hakemus=&lang=fi&preview=true&token=&refuse-grant=true&modify-application=false

Avustuksen saaja vastaa siitä, että valtionavustusjärjestelmään kirjatut yhteyshenkilön yhteystiedot ovat aina ajan tasalla. Yhteyshenkilö vaihdetaan oheisen linkin kautta, joka on käytettävissä läpi avustuksen käyttöajan:



Selvityspyynnöt sekä muut valtionavustusjärjestelmästä hankkeille osoitetut viestit saapuvat osoitteesta no-reply@valtionavustukset.oph.fi, ja ne lähetetään sekä hankkeen yhteyshenkilölle että hakijan ilmoittamaan viralliseen sähköpostiosoitteeseen.

Avustuksen saajan tulee säilyttää tämä viesti sekä viestin sisältämät linkit.

Tarvittaessa tarkempia lisätietoja antaa avustuspäätöksessä nimetty lisätietojen antaja.



Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki
puhelin 029 533 1000
etunimi.sukunimi@oph.fi`)
    })
  })

  async function waitForNewTabToOpen(browser: Browser): Promise<Page> {
    return await new Promise<Page>(resolve =>
      browser.once('targetcreated', target => resolve(target.page())))
  }

  describe('When muutoshakemus enabled haku has been published, a hakemus has been submitted, and päätös has been sent', () => {
    const haku = createRandomHakuValues()
    let avustushakuID: number
    let hakemusID: number

    beforeAll(async () => {
      const hakemusIdAvustushakuId = await ratkaiseMuutoshakemusEnabledAvustushaku(page, haku, answers)
      avustushakuID = hakemusIdAvustushakuId.avustushakuID
      hakemusID = hakemusIdAvustushakuId.hakemusID
    })

    it('hakija gets the correct email content', async () => {
      const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
      emails.forEach(email => {
        const emailContent = email.formatted
        expect(emailContent).toContain(`${HAKIJA_URL}/muutoshakemus`)
        expect(emailContent).toContain('Pääsette tekemään muutoshakemuksen sekä muuttamaan yhteyshenkilöä ja hänen yhteystietojaan koko hankekauden ajan tästä linkistä')
      })
    })

    it('virkailija opens muutoshakemus form when editing the hakemus and hakemus stays in submitted status', async () => {
      await navigateToHakemus(page, avustushakuID, hakemusID)
      await clickElementWithText(page, "button", "Muokkaa hakemusta")
      const newPagePromise = waitForNewTabToOpen(browser)
      await clickElementWithText(page, "button", "Siirry muokkaamaan")
      const modificationPage = await newPagePromise
      await modificationPage.bringToFront()
      expect(modificationPage.url()).toContain(`/muutoshakemus?lang=fi&user-key=`)
      await page.bringToFront()

      // Expect "Siirry muokkkaamaan" link to not exist since the hakemus should still be in submitted status instead of officer_edit
      await reload(page)
      await waitForElementWithText(page, "a", "Siirry muokkaamaan", { hidden: true, timeout: 1000 })
    })

    async function reload(page: Page) {
      await page.reload({ waitUntil: ["load", "networkidle0"] })
    }

    describe('And muutoshakemus #1 has been submitted', () => {
      beforeAll(async () => {
        await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus1)
      })

      describe('And valmistelija gets an email', () => {

        it('email has correct title', async () => {
          const emails = await waitUntilMinEmails(getValmistelijaEmails, 1, hakemusID)
          const title = emails[0]?.formatted.match(/Hanke:.*/)?.[0]
          expectToBeDefined(title)
          expect(title).toContain(`${haku.registerNumber} - ${answers.projectName}`)
        })

        it('email has correct avustushaku link', async () => {
          const linkToHakemus = await getLinkToHakemusFromSentEmails(hakemusID)
          expect(linkToHakemus).toEqual(`${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
        })
      })

      describe('And virkailija navigates to avustushaku', () => {
        beforeAll(async () => {
          await navigate(page, `/avustushaku/${avustushakuID}/`)
        })

        function muutoshakemusStatusField() {
          return `[data-test-id=muutoshakemus-status-${hakemusID}]`
        }

        it('Muutoshakemus status is ☆ Uusi', async () => {
          await page.waitForSelector(muutoshakemusStatusField())
          const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField(), el => el.textContent)
          expect(muutoshakemusStatus).toEqual('☆ Uusi')
        })

        describe('When virkailija clicks muutoshakemus status field', () => {
          beforeAll(async () => {
            await page.click(muutoshakemusStatusField())
          })

          it('Shows the number of pending muutoshakemus in red', async () => {
            await page.waitForFunction(() => (document.querySelector('[data-test-id=number-of-pending-muutoshakemukset]') as HTMLInputElement).innerText === '1')
            const numOfMuutosHakemuksetElement = await page.waitForSelector('[data-test-id=number-of-pending-muutoshakemukset]', { visible: true })
            const color = await page.evaluate(e => getComputedStyle(e).color, numOfMuutosHakemuksetElement)
            expect(color).toBe('rgb(255, 0, 0)') // red
          })

          describe('When virkailija clicks muutoshakemus tab', () => {
            beforeAll(async () => {
              await clickElement(page, 'span.muutoshakemus-tab')
              await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
            })

            it('Displays valid muutoshakemus values', async () => {
              await validateMuutoshakemusValues(page, muutoshakemus1)
            })

            describe('When vakioperustelut have been selected', () => {
              beforeAll(async () => {
                await selectVakioperusteluInFinnish(page)
              })

              describe('And virkailija opens the päätös preview', () => {
                beforeAll(async () => {
                  await clickElementWithText(page, 'a', 'Esikatsele päätösdokumentti')
                })
                afterAll(async () => {
                  await clickElementWithText(page, 'button', 'Sulje')
                })

                it('Muutoshakemus has correct values', async () => {
                  await validateMuutoshakemusPaatosCommonValues(page)
                })

                it('Correct päätös is displayed', async () => {
                  const acceptedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
                  expect(acceptedPaatos).toEqual('Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.')
                })

                it('Correct vakioperustelu is displayed', async () => {
                  await assertAcceptedPäätösHasVakioperustelu(page)
                })
              })
            })

            describe('When virkailija clicks reject button and selects vakioperustelut', () => {
              beforeAll(async () => {
                await clickElement(page, 'label[for="rejected"]')
                await selectVakioperusteluInFinnish(page)
              })

              describe('And opens päätös preview', () => {
                beforeAll(async () => {
                  await clickElementWithText(page, 'a', 'Esikatsele päätösdokumentti')
                })
                afterAll(async () => {
                  await clickElementWithText(page, 'button', 'Sulje')
                })

                it('Correct päätös values are displayed', async () => {
                  await validateMuutoshakemusPaatosCommonValues(page)
                })

                it('Correct päätös is displayed', async () => {
                  const rejectedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
                  expect(rejectedPaatos).toEqual('Opetushallitus hylkää muutoshakemuksen.')
                })

                it('Correct vakioperustelu is displayed', async () => {
                  await assertRejectedPäätösHasVakioperustelu(page)
                })
              })
            })
          })
        })
      })

      describe('When virkailija rejects muutoshakemus', () => {
        beforeAll(async () => {
          await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        })

        it('muutoshakemus has correct values', async () => {
          await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
          await validateMuutoshakemusValues(page, muutoshakemus1, { status: 'rejected'})
        })

        describe('And hakija gets an email', () => {
          let parsedMail: { title: string | undefined, linkToMuutoshakemusPaatos?: string | undefined, linkToMuutoshakemus?: string | undefined }

          beforeAll(async () => {
            parsedMail = await parseMuutoshakemusPaatosFromEmails(hakemusID)
          })

          it('email has correct title', () => {
            expectToBeDefined(parsedMail.title)
            expect(parsedMail.title).toContain(`${haku.registerNumber} - ${answers.projectName}`)
          })

          it('email has link to päätös', async () => {
            expectToBeDefined(parsedMail.linkToMuutoshakemusPaatos)
            expect(parsedMail.linkToMuutoshakemusPaatos).toMatch(/https?:\/\/[^\/]+\/muutoshakemus\/paatos\?user-key=[a-f0-9]{64}/)
          })

          it('email has link to muutoshakemus', () => {
            expectToBeDefined(parsedMail.linkToMuutoshakemus)
            expect(parsedMail.linkToMuutoshakemus).toMatch(/https?:\/\/[^\/]+\/muutoshakemus\?.*/)
          })
        })

        describe('And virkailija navigates to avustushaku', () => {
          beforeAll(async () => {
            await navigate(page, `/avustushaku/${avustushakuID}/`)
          })

          it('muutoshakemus status is shown as "Hylätty"', async () => {
            const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
            await page.waitForSelector(muutoshakemusStatusField)
            const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
            expect(muutoshakemusStatus).toEqual('Hylätty')
          })

        })

        describe('And virkailija navigates to hakemus and clicks muutoshakemus tab', () => {
          let paatosUrl: string

          beforeAll(async () => {
            await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
            await clickElement(page, 'span.muutoshakemus-tab')
            await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
            paatosUrl = await page.$eval('a.muutoshakemus__paatos-link', el => el.textContent) || ''
          })

          it('muutoshakemus status is "rejected"', async () => {
            await validateMuutoshakemusValues(page, muutoshakemus1, { status: 'rejected'})
          })

          describe('And virkailija navigates to päätös', () => {
            beforeAll(async () => {
              await page.goto(paatosUrl, { waitUntil: "networkidle0" })
            })

            it('muutoshakemus has correct values', async () => {
              await validateMuutoshakemusPaatosCommonValues(page)
            })

            it('muutoshakemus päätös is rejected', async () => {
              const rejectedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
              expect(rejectedPaatos).toEqual('Opetushallitus hylkää muutoshakemuksen.')
            })

            it('päätös has vakioperustelu', async () => {
              await assertRejectedPäätösHasVakioperustelu(page)
            })
          })
        })
      })

      describe('And muutoshakemus #2 has been submitted', () => {
        beforeAll(async () => {
          await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
          await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus2)
        })

        describe('And virkailija accepts the muutoshakemus', () => {
          beforeAll(async () => {
            await makePaatosForMuutoshakemusIfNotExists(page, 'accepted', avustushakuID, hakemusID)
            await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
          })

          it('muutoshakemus has correct values', async () => {
            await validateMuutoshakemusValues(page, muutoshakemus2, { status: 'accepted'})
          })

          it('displays correct old project end date', async () => {
            const oldProjectEnd = await getElementInnerText(page, ".answer-old-value #project-end div")
            expect(oldProjectEnd).toEqual("20.04.4200")
          })

          it('displays correct new project end date', async () => {
            const newProjectEnd = await getElementInnerText(page, ".answer-new-value #project-end div")
            expect(newProjectEnd).toEqual(muutoshakemus2.jatkoaika?.format('DD.MM.YYYY'))
          })

          describe('Navigating to avustushaku', () => {
            beforeAll(async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/`)
            })

            it('muutoshakemus status is "hyväksytty"', async () => {
              const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
              await page.waitForSelector(muutoshakemusStatusField)
              const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
              expect(muutoshakemusStatus).toEqual('Hyväksytty')
            })
          })

          describe('Navigating to hakemus and clicking "jatkoaika" tab', () => {
            beforeAll(async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
              await clickElement(page, 'span.muutoshakemus-tab')
              await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
            })

            it('muutoshakemus has correct values', async () => {
              await validateMuutoshakemusValues(page, muutoshakemus2, { status: 'accepted'})
            })

            describe('Navigating to päätös page', () => {
              beforeAll(async () => {
                const paatosUrl = await page.$eval('a.muutoshakemus__paatos-link', el => el.textContent) || ''
                await page.goto(paatosUrl, { waitUntil: "networkidle0" })
              })

              it('päätös has correct values', async () => {
                await validateMuutoshakemusPaatosCommonValues(page)
              })

              it('muutoshakemus has hyväksytty päätös', async () => {
                const acceptedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
                expect(acceptedPaatos).toEqual('Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.')
              })

              it('päätös has vakioperustelu', async () => {
                await assertAcceptedPäätösHasVakioperustelu(page)
              })

            })

          })
        })

        describe('And muutoshakemus #3 has been submitted and rejected and #4 has been submitted', () => {
          beforeAll(async () => {
            await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)

            // create two new muutoshakemus
            await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus3)
            await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
            await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus4)
          })

          describe('And hakija navigates to muutoshakemus', () => {
            let muutoshakemuses: ElementHandle[]

            beforeAll(async () => {
              await navigateToHakijaMuutoshakemusPage(page, hakemusID)
              muutoshakemuses = await page.$$('[data-test-class="existing-muutoshakemus"]')
            })

            it('shows correct amount of muutoshakemuses', async () => {
              expect(muutoshakemuses.length).toEqual(4)
            })

            it('muutoshakemus title contains "Odottaa käsittelyä"', async () => {
              const firstTitle = await muutoshakemuses[0].$eval('.muutoshakemus__title', el => el.textContent)
              expect(firstTitle).toContain('- Odottaa käsittelyä')
            })

            it('shows correct amount of rejected muutoshakemuses', async () => {
              expect(await countElements(page, `span.muutoshakemus__paatos-icon--rejected`)).toEqual(2)
            })
          })

          describe('And virkailija navigates to avustushaku', () => {
            beforeAll(async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/`)
            })

            it('Muutoshakemus status is displayed as "Uusi', async () => {
              const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
              await page.waitForSelector(muutoshakemusStatusField)
              const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
              expect(muutoshakemusStatus).toEqual('☆ Uusi')
            })

            describe('And navigates to hakemus and clicks muutoshakemus tab', () => {
              beforeAll(async () => {
                await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
                await page.waitForFunction(() => (document.querySelector('[data-test-id=number-of-pending-muutoshakemukset]') as HTMLInputElement).innerText === '4')
              })

              describe('And clicks the most recent muutoshakemus', () => {
                beforeAll(async () => {
                  await clickElement(page, 'span.muutoshakemus-tab')
                  await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
                })

                it('muutoshakemus #4 has correct values', async () => {
                  await validateMuutoshakemusValues(page, muutoshakemus4)
                })

                it('project end date is the same which was approved at muutoshakemus #2', async () => {
                  expect(await getElementInnerText(page, '[data-test-id="project-end-date"]')).toBe(muutoshakemus2.jatkoaika?.format('DD.MM.YYYY'))
                })

              })

              describe('And clicks the 2nd most recent muutoshakemus', () => {
                beforeAll(async () => {
                  await clickElement(page, 'button.muutoshakemus-tabs__tab:nth-child(2)')
                })

                it('muutoshakemus #3 has correct values', async () => {
                  await validateMuutoshakemusValues(page, muutoshakemus3, { status: 'rejected' })
                })

                it('project end date is the same which was approved at muutoshakemus #2', async () => {
                  expect(await getElementInnerText(page, '[data-test-id="project-end-date"]')).toBe(muutoshakemus2.jatkoaika?.format('DD.MM.YYYY'))
                })

              })

              describe('And clicks the 3rd most recent muutoshakemus', () => {
                beforeAll(async () => {
                  await clickElement(page, 'button.muutoshakemus-tabs__tab:nth-child(3)')
                })

                it('muutoshakemus #2 has correct values', async () => {
                  await validateMuutoshakemusValues(page, muutoshakemus2, { status: 'accepted' })
                })

                it('muutoshakemus #2 shows the correct project end date', async () => {
                  expect(await getElementInnerText(page, '[data-test-id="project-end-date"]')).toBe('20.04.4200')
                })


              })

              describe('And clicks the 4th most recent muutoshakemus', () => {
                beforeAll(async () => {
                  await clickElement(page, 'button.muutoshakemus-tabs__tab:nth-child(4)')
                })

                it('muutoshakemus #1 has correct values', async () => {
                  await validateMuutoshakemusValues(page, muutoshakemus1, { status: 'rejected' })
                })

                it('muutoshakemus #1 has correct project end date', async () => {
                  expect(await getElementInnerText(page, '[data-test-id="project-end-date"]')).toBe('20.04.4200')
                })

                it('approved jatkoaika from muutoshakemus #2 is shown', async () => {
                  expect(await getElementInnerText(page, '.answer-new-value #project-end')).toBe(muutoshakemus2.jatkoaika?.format('DD.MM.YYYY'))
                })

              })

            })

          })

          describe('And muutoshakemus #5 has been submitted', () => {
            const muutoshakemus = { ...muutoshakemus2, ...{ jatkoaikaPerustelu: 'Voit laittaa lisäaikaa ihan omantunnon mukaan.' }}
            beforeAll(async () => {
              await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
              await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus)
            })

            describe('And virkailija accepts muutoshakemus' , () => {
              beforeAll(async () => {
                await fillMuutoshakemusPaatosWithVakioperustelu(page, avustushakuID, hakemusID)
              })

              it('Correct current project end date is displayed', async () => {
                const currentProjectEndDate = await getElementInnerText(page, '[data-test-id="current-project-end-date"]')
                expect(currentProjectEndDate).toBe(muutoshakemus2.jatkoaika?.format('DD.MM.YYYY'))
              })

              it('Correct applied change date is displayed', async () => {
                const appliedProjectEndDate = await getElementInnerText(page, '[data-test-id="approve-with-changes-muutoshakemus-jatkoaika"]')
                expect(appliedProjectEndDate).toBe(muutoshakemus2.jatkoaika?.format('DD.MM.YYYY'))
              })

              it('Correct päättymispäivä is displayed in päätös preview', async () => {
                await clickElementWithText(page, 'a', 'Esikatsele päätösdokumentti')
                await page.waitForSelector('.muutoshakemus-paatos__content')
                const acceptedDate = await page.$eval('[data-test-id="paattymispaiva-value"]', el => el.textContent)
                expect(acceptedDate).toBe('20.4.2400')
                await clickElementWithText(page, 'button', 'Sulje')
              })

              describe('After sending päätös', () => {
                beforeAll(async () => {
                  await fillAndSendMuutoshakemusDecision(page, 'accepted_with_changes', '20.04.2400')
                })

                it('Correct päättymispäivä is displayed to virkailija', async () => {
                  const acceptedDate = await page.$eval('[data-test-id="muutoshakemus-jatkoaika"]', el => el.textContent)
                  expect(acceptedDate).toBe('20.04.2400')
                })

                it('New project end date title is displayed to virkailija in finnish', async () => {
                  const title = await page.$eval('[data-test-id="muutoshakemus-new-end-date-title"]', el => el.textContent)
                  expect(title).toBe('Hyväksytty uusi viimeinen käyttöpäivä')
                })

                it('Old project end date title is displayed to virkailija in finnish', async () => {
                  const title = await page.$eval('[data-test-id="muutoshakemus-current-end-date-title"]', el => el.textContent)
                  expect(title).toBe('Vanha viimeinen käyttöpäivä')
                })

                it('Reasoning title is displayed to virkailija in finnish', async () => {
                  const title = await page.$eval('[data-test-id="muutoshakemus-reasoning-title"]', el => el.textContent)
                  expect(title).toBe('Hakijan perustelut')
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
                  await navigateToHakijaMuutoshakemusPage(page, hakemusID)
                  const acceptedDate = await textContent(page, '[data-test-id="muutoshakemus-jatkoaika"]')
                  expect(acceptedDate).toBe('20.04.2400')
                })

              })
            })
          })

        })

      })
    })
  })

  describe('When virkailija creates avustushaku #1', () => {
    const name = `Hakuna matata - haku ${randomString()}`
    const hankkeenAlkamispaiva = '20.04.1969'
    const hankkeenPaattymispaiva = '29.12.1969'

    beforeAll(async () => {
      await createHakuFromEsimerkkihaku(page, {
        name,
        hankkeenAlkamispaiva,
        hankkeenPaattymispaiva,
      })
    })

    describe('And creates avustushaku #2', () => {
      beforeAll(async () => {
        await createHakuFromEsimerkkihaku(page, {
          name: `Makuulla hatata - haku ${randomString()}`
        })
      })

      describe('And navigates from avustushaku #2 to avustushaku #1 päätös tab', () => {
        beforeAll(async () => {
          await clickElementWithText(page, 'td', name)
          await clickElement(page, '[data-test-id="päätös-välilehti"]')
          await page.waitForSelector('[data-test-id="hankkeen-alkamispaiva"] div.datepicker input', {visible: true, timeout: 5 * 1000})
        })

        it('Correct avustushaku start date is displayed', async () => {
          const val = await getElementAttribute(page, '[data-test-id="hankkeen-alkamispaiva"] div.datepicker input', 'value')
          expect(val).toBe(hankkeenAlkamispaiva)
        })

        it('Correct avustushaku end date is displayed', async () => {
          const val = await getElementAttribute(page, '[data-test-id="hankkeen-paattymispaiva"] div.datepicker input', 'value')
          expect(val).toBe(hankkeenPaattymispaiva)
        })

        it('Correct start date label is displayed', async () => {
          const label = await getElementInnerText(page, '[data-test-id="hankkeen-alkamispaiva"] [data-test-id="label"]')
          expect(label).toBe('Avustuksen ensimmäinen käyttöpäivä')
        })

        it('Correct end date label is displayed', async () => {
          const label = await getElementInnerText(page, '[data-test-id="hankkeen-paattymispaiva"] [data-test-id="label"]')
          expect(label).toBe('Avustuksen viimeinen käyttöpäivä')
        })

      })
    })
  })

  describe("When budjettimuutoshakemus enabled haku has been published, a hakemus has been submitted, and päätös has been sent", () => {
    let linkToMuutoshakemus: string
    let avustushakuID: number
    let hakemusID: number
    const newName = randomString()
    const newEmail = "uusi.email@reaktor.com"
    const newPhone = "0901967632"
    const haku = createRandomHakuValues()

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(page, haku, answers, defaultBudget)
      avustushakuID = avustushakuId
      hakemusID = hakemusId
      linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(hakemusID)
    })

    it('hakija gets an email with a link to muutoshakemus', async () => {
      const userKey = await getUserKey(hakemusID)
      expect(linkToMuutoshakemus).toContain(`${HAKIJA_URL}/muutoshakemus?lang=fi&user-key=${userKey}&avustushaku-id=${avustushakuID}`)
    })

    it('hakija gets the correct email content', async () => {
      const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
      emails.forEach(email => {
        const emailContent = email.formatted
        expect(emailContent).toContain(`${HAKIJA_URL}/muutoshakemus`)
        expect(emailContent).toContain('Pääsette tekemään muutoshakemuksen sekä muuttamaan yhteyshenkilöä ja hänen yhteystietojaan koko hankekauden ajan tästä linkistä')
      })
    })

    describe('And user navigates to muutoshakemus page', () => {
      beforeAll(async () => {
        expectToBeDefined(linkToMuutoshakemus)
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
      })

      it('shows correct avustushaku name', async () => {
        const avustushakuNameSpan = await page.waitForSelector("[data-test-id=avustushaku-name]", { visible: true })
        const avustushakuName = await page.evaluate(element => element.textContent, avustushakuNameSpan)
        expect(avustushakuName).toEqual(haku.avustushakuName)
      })

      it('shows correct project name', async () => {
        const projectNameDiv = await page.waitForSelector("[data-test-id=project-name]", { visible: true })
        const projectName = await page.evaluate(element => element.textContent, projectNameDiv)
        expect(projectName).toEqual(answers.projectName)
      })

      it('shows correct register number', async () => {
        const registerNumberSpan = await page.waitForSelector("[data-test-id=register-number]", { visible: true })
        const registerNumber = await page.evaluate(element => element.textContent, registerNumberSpan)
        expect(registerNumber).toEqual(haku.registerNumber)
      })

      it('shows correct contact person name', async () => {
        const contactPersonInput = await page.waitForSelector("#muutoshakemus__contact-person", { visible: true })
        const contactPerson = await page.evaluate(element => element.value, contactPersonInput)
        expect(contactPerson).toEqual(answers.contactPersonName)
      })

      it('shows correct contact person email', async () => {
        const contactPersonEmailInput = await page.waitForSelector("#muutoshakemus__email", { visible: true })
        const contactPersonEmail = await page.evaluate(element => element.value, contactPersonEmailInput)
        expect(contactPersonEmail).toEqual(answers.contactPersonEmail)
      })

      it('shows correct contact person number', async () => {
        const contactPersonPhoneInput = await page.waitForSelector("#muutoshakemus__phone", { visible: true })
        const contactPersonPhoneNumber = await page.evaluate(element => element.value, contactPersonPhoneInput)
        expect(contactPersonPhoneNumber).toEqual(answers.contactPersonPhoneNumber)
      })

      async function sendMuutospyyntoButtonIsDisabled() {
        return await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
      }

      it('send button is disabled', async () => {
        await page.waitForSelector("#send-muutospyynto-button", { visible: true })
        expect(await sendMuutospyyntoButtonIsDisabled()).toBeTruthy()
      })

      describe('When user views original hakemus', () => {
        let frameContent: Frame

        beforeAll(async () => {
          const iframe = await page.waitForSelector("iframe[data-test-id=original-hakemus]")
          if (!iframe) throw Error("Original hakemus iframe not found on page :mad:")
          const fc = await iframe.contentFrame()
          if (!fc) throw Error("Original hakemus frameContent not found on page :mad:")
          frameContent = fc
        })

        it('iframe content can be found', () => {
          expect(frameContent).toBeTruthy()
        })

        it('correct contact person name is displayed', async () => {
          expect(await getElementInnerText(frameContent, "[id='signatories-fieldset-1.name']"))
            .toStrictEqual(answers.contactPersonName)
        })

        it('correct Y-tunnus is displayed', async () => {
          expect(await getElementInnerText(frameContent, "#business-id"))
            .toStrictEqual(TEST_Y_TUNNUS)
        })

      })

      describe('And user fills muutoshakemus with invalid email address', () => {
        beforeAll(async () => {
          await clearAndType(page, '#muutoshakemus__contact-person', newName)
          await clearAndType(page, '#muutoshakemus__email', "not-email")
          await clearAndType(page, '#muutoshakemus__phone', newPhone)
        })

        afterAll(async () => {
          await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
        })

        it('send button is disabled', async () => {
          const sendMuutospyyntoButtonIsDisabledAfterInvalidEmail = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
          expect(sendMuutospyyntoButtonIsDisabledAfterInvalidEmail).toBeTruthy()
        })

        it('email field class contains "error"', async () => {
          const emailInputFieldClassWhenInvalidEmail = await getElementAttribute(page, "#muutoshakemus__email", "class")
          expectToBeDefined(emailInputFieldClassWhenInvalidEmail)
          expect(emailInputFieldClassWhenInvalidEmail).toContain("error")
        })

        describe('After fixing the invalid email address', () => {
          beforeAll(async () => {
            await clearAndType(page, '#muutoshakemus__email', newEmail)
          })

          it('send button is enabled', async () => {
            const sendMuutospyyntoButtonIsDisabled = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
            expect(sendMuutospyyntoButtonIsDisabled).toBeFalsy()
          })

          it('email field class does not contain "error"', async () => {
            const emailInputFieldClassWithValidEmail = await getElementAttribute(page, "#muutoshakemus__email", "class")
            expect(emailInputFieldClassWithValidEmail).toBeFalsy()
          })

        })

      })

      describe('And user fills muutoshakemus with correct values', () => {
        beforeAll(async () => {
          await clearAndType(page, '#muutoshakemus__contact-person', newName)
          await clearAndType(page, '#muutoshakemus__email', newEmail)
          await clearAndType(page, '#muutoshakemus__phone', newPhone)
        })

        it('send button is enabled', async () => {
          expect(await sendMuutospyyntoButtonIsDisabled()).toBeFalsy()
        })

        describe('And clicks "send" button', () => {
          beforeAll(async () => {
            await clickElement(page, "#send-muutospyynto-button")
          })

          describe('And virkailija navigates to avustushaku', () => {
            beforeAll(async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/`)
              await Promise.all([
                page.waitForNavigation(),
                clickElementWithText(page, "td", "Akaan kaupunki"),
              ])
            })

            it('correct old applicant name is displayed', async () => {
              await page.waitForSelector('.answer-old-value #applicant-name div')
              const oldContactPersonNameOnPage = await getElementInnerText(page, ".answer-old-value #applicant-name div")
              expect(oldContactPersonNameOnPage).toEqual("Erkki Esimerkki")
            })

            it('correct changed applicant name is displayed', async () => {
              const contactPersonNameOnPage = await getElementInnerText(page, ".answer-new-value #applicant-name div")
              expect(contactPersonNameOnPage).toEqual(newName)
            })

            it('correct old phone number is displayed', async () => {
              const oldContactPersonPhoneOnPage = await getElementInnerText(page, ".answer-old-value #textField-0 div")
              expect(oldContactPersonPhoneOnPage).toEqual("666")
            })

            it('correct new phone number is displayed', async () => {
              const contactPersonPhoneOnPage = await getElementInnerText(page, ".answer-new-value #textField-0 div")
              expect(contactPersonPhoneOnPage).toEqual(newPhone)
            })

            it('correct old email is displayed', async () => {
              const oldContactPersonEmailOnPage = await getElementInnerText(page, ".answer-old-value #primary-email div")
              expect(oldContactPersonEmailOnPage).toEqual("erkki.esimerkki@example.com")
            })

            it('correct new email is displayed', async () => {
              const contactPersonEmailOnPage = await getElementInnerText(page, ".answer-new-value #primary-email div")
              expect(contactPersonEmailOnPage).toEqual(newEmail)
            })

            it('virkailija sees paatos email preview with the muutoshakemus link', async () => {
              await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
              await page.waitForSelector('.decision-email-content')
              const emailContent = await getElementInnerText(page, '.decision-email-content')
              expect(emailContent).toContain('/muutoshakemus?lang=fi&user-key=')
            })

            async function navigateToAkaanKaupunkiHakemus(page: Page) {
              await navigate(page, `/avustushaku/${avustushakuID}/`)
              await Promise.all([
                page.waitForNavigation(),
                clickElementWithText(page, "td", "Akaan kaupunki"),
              ])
              await page.waitForSelector('.answer-old-value #applicant-name div')
            }

            describe('And virkailija navigates to hakemus and opens printable link', () => {
              let printablePage: Page

              beforeAll(async () => {
                await navigateToAkaanKaupunkiHakemus(page)
                await page.waitForSelector('[data-test-id="hakemus-printable-link"]')
                const printableVersionTab = new Promise(x => browser.once('targetcreated', target => x(target.page()))) as Promise<Page>
                await page.click('[data-test-id="hakemus-printable-link"]')

                printablePage = await printableVersionTab
                await printablePage.waitForSelector('#applicant-name div')
              })

              afterAll(async () => {
                printablePage.close()
              })

              it('printable version shows correct name', async () => {
                expect(await getElementInnerText(printablePage, "#applicant-name div")).toEqual(newName)
              })

              it('printable version shows correct email', async () => {
                expect(await getElementInnerText(printablePage, "#primary-email div")).toEqual(newEmail)
              })

              it('printable version shows correct phone number', async () => {
                expect(await getElementInnerText(printablePage, "#textField-0 div")).toEqual(newPhone)
              })

            })

            describe('And re-sends päätös emails', () => {
              let oldNameOnPage: string | undefined
              let nameOnPage: string | undefined
              let oldPhoneOnPage: string | undefined
              let phoneOnPage: string | undefined
              let oldEmailOnPage: string | undefined
              let emailOnPage: string | undefined

              beforeAll(async () => {
                await navigateToAkaanKaupunkiHakemus(page)
                oldNameOnPage = await getElementInnerText(page, ".answer-old-value #applicant-name div")
                nameOnPage = await getElementInnerText(page, ".answer-new-value #applicant-name div")
                oldPhoneOnPage = await getElementInnerText(page, ".answer-old-value #textField-0 div")
                phoneOnPage = await getElementInnerText(page, ".answer-new-value #textField-0 div")
                oldEmailOnPage = await getElementInnerText(page, ".answer-old-value #primary-email div")
                emailOnPage = await getElementInnerText(page, ".answer-new-value #primary-email div")

                page.on('dialog', async dialog => { dialog.accept() })
                await page.click('[data-test-id=resend-paatos]')
                await page.waitForSelector('[data-test-id=paatos-resent]')

                // reload to see possibly changed values
                await navigateToAkaanKaupunkiHakemus(page)
              })

              it('applicant old name is not overwritten', async () => {
                expect(await getElementInnerText(page, ".answer-old-value #applicant-name div")).toEqual(oldNameOnPage)
              })
              it('applicant new name is not overwritten', async () => {
                expect(await getElementInnerText(page, ".answer-new-value #applicant-name div")).toEqual(nameOnPage)
              })
              it('applicant old phone number is not overwritten', async () => {
                expect(await getElementInnerText(page, ".answer-old-value #textField-0 div")).toEqual(oldPhoneOnPage)
              })
              it('applicant new phone number is not overwritten', async () => {
                expect(await getElementInnerText(page, ".answer-new-value #textField-0 div")).toEqual(phoneOnPage)
              })
              it('applicant old email is not overwritten', async () => {
                expect(await getElementInnerText(page, ".answer-old-value #primary-email div")).toEqual(oldEmailOnPage)
              })
              it('applicant new email is not overwritten', async () => {
                expect(await getElementInnerText(page, ".answer-new-value #primary-email div")).toEqual(emailOnPage)
              })

            })
          })
        })
      })
    })
  })
})
