import { expect, test } from '@playwright/test'
import { JotpaTest, SwedishJotpaTest } from '../../fixtures/JotpaTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'
import {
  getHakemusSubmitted,
  getMuutoshakemusEmails,
  pollUntilNewHakemusEmailArrives,
  waitUntilMinEmails,
} from '../../utils/emails'
import { HakijaPaatosPage } from '../../pages/hakija/HakijaPaatosPage'

const jotpaFont = 'Montserrat, sans-serif'
const jotpaColour = 'rgb(0, 155, 98)'

test.describe.configure({ mode: 'parallel' })

JotpaTest(
  'Suomenkielisen Jotpa-hakemuksen täyttäminen',
  async ({ page, avustushakuID, answers }) => {
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const buffyEmail = 'buffy.summers@askjeeves.com'
    let hakemusUrl: string
    await hakijaAvustusHakuPage.navigate(avustushakuID, 'fi')

    await test.step('Etusivulla', async () => {
      await test.step('Näyttää jotpan suomenkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-fi.png')
      })
      await test.step('Näyttää Jotpan faviconin', async () => {
        await expect(page.locator('#favicon')).toHaveAttribute(
          'href',
          '/img/jotpa/jotpa-favicon.ico'
        )
      })

      await test.step('Luo uusi hakemus nappula on jotpan väreissä', async () => {
        await hakijaAvustusHakuPage.form.muutoshakuEnabledFields.primaryEmail.fill(buffyEmail)
        await expect(page.locator('.soresu-text-button')).not.toBeDisabled()
        await expect(page.locator('.soresu-text-button')).toHaveCSS('background-color', jotpaColour)
      })
    })

    await test.step('Hakemussivulla', async () => {
      hakemusUrl = await hakijaAvustusHakuPage.startApplication(avustushakuID, buffyEmail)
      await page.goto(hakemusUrl)
      await hakijaAvustusHakuPage.fillApplication(answers, TEST_Y_TUNNUS)

      await test.step('Näyttää jotpan suomenkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-fi.png')
      })

      await test.step('Näyttää Jotpan fontin', async () => {
        await expect(page.locator('#topbar h1')).toHaveCSS('font-family', jotpaFont)
        await expect(page.locator('.soresu-form h1')).toHaveCSS('font-family', jotpaFont)
        await expect(page.locator('#project-info')).toHaveCSS('font-family', jotpaFont)
      })

      await test.step('Näyttää Jotpan faviconin', async () => {
        await expect(page.locator('#favicon')).toHaveAttribute(
          'href',
          '/img/jotpa/jotpa-favicon.ico'
        )
      })

      await test.step('Näyttää aktiivisen nappulan jotpan väreissä', async () => {
        const yliopistoButton = page.getByText('Yliopisto')
        await yliopistoButton.click()
        await expect(yliopistoButton).toHaveCSS('border-color', jotpaColour)
      })

      await test.step('Näyttää liitetiedoston lisäysnappulan Jotpan väreissä', async () => {
        await expect(page.locator('.soresu-file-upload .soresu-upload-button').first()).toHaveCSS(
          'background-color',
          jotpaColour
        )
      })

      await test.step('Näyttää jotpan myöntämä avustus tekstin', async () => {
        await expect(page.getByText('Jotpan myöntämä avustus')).toBeVisible()
        await expect(page.getByText('OPH:n myöntämä avustus')).not.toBeVisible()
      })

      await test.step('Näyttää jotpan rahoitus tekstin', async () => {
        await expect(page.getByText('Jotpan rahoitus-%')).toBeVisible()
        await expect(page.getByText('OPH:n rahoitus-%')).not.toBeVisible()
      })

      await test.step('Lähetä käsiteltäväksi -nappula sisältää maininnan jotpasta opetushallituksen sijaan', async () => {
        await expect(
          page.getByText(
            'Kun hakemus on valmis, se lähetetään Jatkuvan oppimisen ja työllisyyden palvelukeskuksen käsiteltäväksi'
          )
        ).not.toBeVisible()
        page.getByText('Lähetä käsiteltäväksi').hover()
        await expect(
          page.getByText(
            'Kun hakemus on valmis, se lähetetään Jatkuvan oppimisen ja työllisyyden palvelukeskuksen käsiteltäväksi'
          )
        ).toBeVisible()
      })

      await test.step('Näyttää aktiivisen "Lähetä käsiteltäväksi" nappulan Jotpan väreissä', async () => {
        await hakijaAvustusHakuPage.fillMuutoshakemusEnabledHakemus(answers)
        await expect(page.locator('#topbar #submit')).toHaveCSS('background-color', jotpaColour)
      })
    })

    await test.step('"Linkki avustushakemukseen"-Sähköpostissa', async () => {
      const newHakemusEmail = (await pollUntilNewHakemusEmailArrives(avustushakuID, buffyEmail))[0]

      await test.step('oph on korvattu jotpalla niiltä osin kuin on sovittu', async () => {
        expect(newHakemusEmail['from-address']).toEqual('no-reply@jotpa.fi')

        expect(newHakemusEmail.formatted).not.toContain(
          'voitte olla yhteydessä osoitteeseen valtionavustukset@oph.fi'
        )
        expect(newHakemusEmail.formatted).toContain(
          'voitte olla yhteydessä osoitteeseen rahoitus@jotpa.fi'
        )

        expect(newHakemusEmail.formatted).not.toContain(
          `Opetushallitus
Hakaniemenranta 6`
        )
        expect(newHakemusEmail.formatted).toContain(
          `Jatkuvan oppimisen ja työllisyyden palvelukeskus
Hakaniemenranta 6`
        )

        expect(newHakemusEmail.formatted).not.toContain('etunimi.sukunimi@oph.fi')
        expect(newHakemusEmail.formatted).toContain('etunimi.sukunimi@jotpa.fi')
      })
    })

    await test.step('"Hakemus vastaanotettu"-Sähköpostissa', async () => {
      await hakijaAvustusHakuPage.submitApplication()

      const userKey = await hakijaAvustusHakuPage.getUserKey()
      const hakemusID = await hakijaAvustusHakuPage.getHakemusID(avustushakuID, userKey)
      const email = (await waitUntilMinEmails(getHakemusSubmitted, 1, hakemusID))[0]
      console.log(email)

      await test.step('on oikean lähettäjän osoite', async () => {
        expect(email['from-address']).toEqual('no-reply@jotpa.fi')
      })

      await test.step('on oikean lähettäjän nimi', async () => {
        expect(email.formatted).not.toContain(`Opetushallitus`)
        expect(email.formatted).toContain(`Jatkuvan oppimisen ja työllisyyden palvelukeskus`)
      })
    })

    await test.step('Hakemuksen esikatselu sivulla', async () => {
      await page.goto(hakemusUrl + '&preview=true')

      await test.step('Näyttää jotpan suomenkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-fi.png')
      })

      await test.step('Näyttää Jotpan fontin', async () => {
        await expect(page.locator('#topbar h1')).toHaveCSS('font-family', jotpaFont)
        await expect(page.locator('.soresu-preview h1')).toHaveCSS('font-family', jotpaFont)
        await expect(page.locator('#project-info')).toHaveCSS('font-family', jotpaFont)
      })

      await test.step('Näyttää Jotpan faviconin', async () => {
        await expect(page.locator('#favicon')).toHaveAttribute(
          'href',
          '/img/jotpa/jotpa-favicon.ico'
        )
      })
    })
  }
)

SwedishJotpaTest(
  'Ruotsinkielisen Jotpa-hakemuksen täyttäminen',
  async ({ page, avustushakuID, answers }) => {
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const faithEmail = 'faith.lehane@altavista.com'
    await hakijaAvustusHakuPage.navigate(avustushakuID, 'sv')
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(avustushakuID, faithEmail)

    await test.step('Etusivulla', async () => {
      await test.step('Näyttää etusivulla Jotpan ruotsinkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-sv.png')
      })
    })

    await test.step('Hakemussivulla', async () => {
      await page.goto(hakemusUrl)
      await hakijaAvustusHakuPage.fillApplication(answers, TEST_Y_TUNNUS)

      await test.step('Näyttää jotpan ruotsinkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-sv.png')
      })
    })

    await test.step('"Linkki avustushakemukseen"-Sähköpostissa', async () => {
      const newHakemusEmail = (await pollUntilNewHakemusEmailArrives(avustushakuID, faithEmail))[0]

      await test.step('oph on korvattu jotpalla niiltä osin kuin on sovittu', async () => {
        expect(newHakemusEmail['from-address']).toEqual('no-reply@jotpa.fi')

        expect(newHakemusEmail.formatted).not.toContain(
          'per e-post på adressen statsunderstod@oph.fi'
        )
        expect(newHakemusEmail.formatted).toContain('per e-post på adressen rahoitus@jotpa.fi')

        expect(newHakemusEmail.formatted).not.toContain(
          `Utbildningsstyrelsen
Hagnäskajen 6`
        )
        expect(newHakemusEmail.formatted).toContain(
          `Servicecentret för kontinuerligt lärande och sysselsättning
Hagnäskajen 6`
        )

        expect(newHakemusEmail.formatted).not.toContain('fornamn.efternamn@oph.fi')
        expect(newHakemusEmail.formatted).toContain('fornamn.efternamn@jotpa.fi')
      })
    })

    await test.step('"Hakemus vastaanotettu"-Sähköpostissa', async () => {
      await hakijaAvustusHakuPage.fillMuutoshakemusEnabledHakemus(answers)
      const { userKey } = await hakijaAvustusHakuPage.submitApplication()
      const hakemusID = await hakijaAvustusHakuPage.getHakemusID(avustushakuID, userKey)
      const email = (await waitUntilMinEmails(getHakemusSubmitted, 1, hakemusID))[0]
      console.log(email)

      await test.step('on oikean lähettäjän osoite', async () => {
        expect(email['from-address']).toEqual('no-reply@jotpa.fi')
      })

      await test.step('on oikean lähettäjän nimi', async () => {
        expect(email.formatted).not.toContain(`Utbildningsstyrelsen`)
        expect(email.formatted).toContain(
          `Servicecentret för kontinuerligt lärande och sysselsättning`
        )
      })
    })
  }
)

JotpaTest(
  'Hyväksytyllä suomenkielisellä Jotpa-hakemuksella',
  async ({ page, avustushakuID, acceptedHakemus }) => {
    const { userKey } = acceptedHakemus

    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const hakemusID = await hakijaAvustusHakuPage.getHakemusID(avustushakuID, userKey)
    const emails = await waitUntilMinEmails(getMuutoshakemusEmails, 1, hakemusID)
    const email = emails[0]

    await test.step('on päätöksellä', async () => {
      const hakijaPaatosPage = HakijaPaatosPage(page)
      await hakijaPaatosPage.navigate(acceptedHakemus.hakemusID)

      await test.step('jotpan suomenkielinen logo', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('paatos-jotpa-logo-fi.png')
      })

      await test.step('jotpan fontti headerissa ja leipätekstissä', async () => {
        await expect(page.getByTestId('paatos-header-title')).toHaveCSS('font-family', jotpaFont)
        await expect(page.getByTestId('paatos-accepted-title')).toHaveCSS('font-family', jotpaFont)
      })

      await test.step('jotpan faviconi', async () => {
        await expect(page.locator('#favicon')).toHaveAttribute(
          'href',
          '/img/jotpa/jotpa-favicon.ico'
        )
      })

      await test.step('maininta jotpasta opetushallituksen sijaan', async () => {
        await expect(page.getByText('Opetushallitus')).not.toBeVisible()
        await expect(
          page.getByText(
            'Jatkuvan oppimisen ja työllisyyden palvelukeskus on päättänyt myöntää valtionavustusta hankkeelle'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'Jatkuvan oppimisen ja työllisyyden palvelukeskus myöntää avustusta hankkeelle'
          )
        ).toBeVisible()

        await expect(page.getByText('Opetushallituksella')).not.toBeVisible()
        await expect(
          page.getByText(
            'Jatkuvan oppimisen ja työllisyyden palvelukeskuksella ja muilla tässä päätöksessä listatuilla viranomaistahoilla'
          )
        ).toBeVisible()

        await expect(page.getByText('OPETUSHALLITUKSELTA')).not.toBeVisible()
        await expect(
          page.getByText('JATKUVAN OPPIMISEN JA TYÖLLISYYDEN PALVELUKESKUKSELTA')
        ).toBeVisible()
      })
    })

    await test.step('on oikea vastuutaho sähköpostiviestissä', async () => {
      expect(email.formatted).toContain(
        'Mikäli ette ota päätöksen mukaista avustusta vastaan, tulee siitä ilmoittaa Jatkuvan oppimisen ja työllisyyden palvelukeskukselle'
      )
      expect(email.formatted).toContain('viestit saapuvat osoitteesta no-reply@jotpa.fi')

      expect(email.formatted).not.toContain(
        'Mikäli ette ota päätöksen mukaista avustusta vastaan, tulee siitä ilmoittaa Opetushallitukselle'
      )
    })

    await test.step('on oikea signature block sähköpostiviestissä', async () => {
      expect(email.formatted).toContain(
        'Jatkuvan oppimisen ja työllisyyden palvelukeskus\n' +
          'Hakaniemenranta 6\n' +
          'PL 380, 00531 Helsinki\n' +
          'puhelin 029 533 1000\n' +
          'etunimi.sukunimi@@jotpa.fi'
      )
    })

    await test.step('sähköpostiviesti tulee osoitteesta no-reply@jotpa.fi', async () => {
      expect(email['from-address']).toBe('no-reply@jotpa.fi')
    })
  }
)

JotpaTest(
  'Hylätyllä suomenkielisellä Jotpa-hakemuksella',
  async ({ page, rejectedHakemusEmails, rejectedHakemus }) => {
    const { emails } = rejectedHakemusEmails
    const email = (await emails)[0]

    await test.step('on oikea signature block sähköpostiviestissä', async () => {
      expect(email.formatted).toContain(
        'Jatkuvan oppimisen ja työllisyyden palvelukeskus\n' +
          'Hakaniemenranta 6\n' +
          'PL 380, 00531 Helsinki\n' +
          'puhelin 029 533 1000\n' +
          'etunimi.sukunimi@@jotpa.fi'
      )
    })

    await test.step('sähköpostiviesti tulee osoitteesta no-reply@jotpa.fi', async () => {
      expect(email['from-address']).toBe('no-reply@jotpa.fi')
    })

    await test.step('on päätöksellä', async () => {
      const { hakemusID } = rejectedHakemus
      const hakijaPaatosPage = HakijaPaatosPage(page)
      await hakijaPaatosPage.navigate(hakemusID)

      await test.step('jotpan suomenkielinen logo', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('paatos-jotpa-logo-fi.png')
      })

      await test.step('jotpan fontti headerissa ja leipätekstissä', async () => {
        await expect(page.getByTestId('paatos-header-title')).toHaveCSS('font-family', jotpaFont)
        await expect(page.getByTestId('paatos-title')).toHaveCSS('font-family', jotpaFont)
      })

      await test.step('jotpan faviconi', async () => {
        await expect(page.locator('#favicon')).toHaveAttribute(
          'href',
          '/img/jotpa/jotpa-favicon.ico'
        )
      })

      await test.step('maininta jotpasta opetushallituksen sijaan', async () => {
        await expect(page.getByText('Opetushallitus')).not.toBeVisible()
        await expect(
          page.getByText(
            'Jatkuvan oppimisen ja työllisyyden palvelukeskus on päättänyt olla myöntämättä valtionavustusta hankkeelle'
          )
        ).toBeVisible()
      })
    })
  }
)

SwedishJotpaTest(
  'Hylätyllä ruotsinkielisellä Jotpa-hakemuksella',
  async ({ page, rejectedHakemus, rejectedHakemusEmails }) => {
    const { emails } = rejectedHakemusEmails
    const email = (await emails)[0]

    await test.step('on oikea signature block sähköpostiviestissä', async () => {
      expect(email.formatted).toContain(
        'Servicecentret för kontinuerligt lärande och sysselsättning\n' +
          'Hagnäskajen 6\n' +
          'PB 380, 00531 Helsingfors\n' +
          'telefon 029 533 1000\n' +
          'fornamn.efternamn@@jotpa.fi'
      )
    })

    await test.step('sähköpostiviesti tulee osoitteesta no-reply@jotpa.fi', async () => {
      expect(email['from-address']).toBe('no-reply@jotpa.fi')
    })

    await test.step('on päätöksellä', async () => {
      const { hakemusID } = rejectedHakemus
      const hakijaPaatosPage = HakijaPaatosPage(page)
      await hakijaPaatosPage.navigate(hakemusID)

      await test.step('jotpan ruotsinkielinen logo', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('paatos-jotpa-logo-sv.png')
      })

      await test.step('jotpan fontti headerissa ja leipätekstissä', async () => {
        await expect(page.getByTestId('paatos-header-title')).toHaveCSS('font-family', jotpaFont)
        await expect(page.getByTestId('paatos-title')).toHaveCSS('font-family', jotpaFont)
      })

      await test.step('jotpan faviconi', async () => {
        await expect(page.locator('#favicon')).toHaveAttribute(
          'href',
          '/img/jotpa/jotpa-favicon.ico'
        )
      })

      await test.step('maininta jotpasta opetushallituksen sijaan', async () => {
        await expect(page.getByText('Opetushallitus')).not.toBeVisible()
        await expect(
          page.getByText(
            'Servicecentret för kontinuerligt lärande och sysselsättning har beslutat att inte bevilja statsunderstöd till projektet'
          )
        ).toBeVisible()
      })
    })
  }
)

SwedishJotpaTest(
  'Hyväksytyllä ruotsinkielisellä Jotpa-hakemuksella',
  async ({ page, avustushakuID, acceptedHakemus }) => {
    const { userKey } = acceptedHakemus

    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const hakemusID = await hakijaAvustusHakuPage.getHakemusID(avustushakuID, userKey)
    const emails = await waitUntilMinEmails(getMuutoshakemusEmails, 1, hakemusID)
    const email = emails[0]

    await test.step('on oikea vastuutaho sähköpostiviestissä', async () => {
      expect(email.formatted).toContain(
        'Om ni inte tar emot understödet i enlighet med beslutet, ska ni meddela om detta till Servicecentret för kontinuerligt lärande och sysselsättning inom den tidsfrist som anges i beslutet.'
      )
      expect(email.formatted).toContain('skickas från adressen no-reply@jotpa.fi')

      expect(email.formatted).not.toContain(
        'Om ni inte tar emot understödet i enlighet med beslutet, ska ni meddela om detta till Utbildningsstyrelsen inom den tidsfrist som anges i beslutet.'
      )
    })

    await test.step('on oikea signature block sähköpostiviestissä', async () => {
      expect(email.formatted).toContain(
        'Servicecentret för kontinuerligt lärande och sysselsättning\n' +
          'Hagnäskajen 6\n' +
          'PB 380, 00531 Helsingfors\n' +
          'telefon 029 533 1000\n' +
          'fornamn.efternamn@@jotpa.fi'
      )
    })
  }
)
