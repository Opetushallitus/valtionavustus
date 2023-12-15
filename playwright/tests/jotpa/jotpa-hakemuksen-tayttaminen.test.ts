import { expect } from '@playwright/test'
import { JotpaTest } from '../../fixtures/JotpaTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'
import { pollUntilNewHakemusEmailArrives } from '../../utils/emails'

JotpaTest('Jotpa-hakemuksen täyttäminen', async ({ page, avustushakuID }) => {
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  const buffyEmail = 'buffy.summers@askjeeves.com'
  const faithEmail = 'faith.lehane@altavista.com'

  await JotpaTest.step('Suomenkielisellä hakemuksella', async () => {
    await hakijaAvustusHakuPage.navigate(avustushakuID, 'fi')
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      buffyEmail
    )

    await JotpaTest.step('Etusivulla', async () => {
      await JotpaTest.step('Näyttää jotpan suomenkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-fi.png')
      })
      await JotpaTest.step('Näyttää Jotpan faviconin', async () => {
        await expect(page.locator('#favicon')).toHaveAttribute(
          'href',
          '/img/jotpa/jotpa-favicon.ico'
        )
      })

      await JotpaTest.step('Infopallura on jotpan väreissä', async () => {
        await expect(page.locator('.jotpa-help-icon')).toBeVisible()
      })

      await JotpaTest.step('Luo uusi hakemus nappula on jotpan väreissä', async () => {
        await expect(page.locator('.jotpa-text-button')).toBeVisible()
      })
    })


    await JotpaTest.step('Hakemussivulla', async () => {
      await page.goto(hakemusUrl)
      await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

      await JotpaTest.step('Näyttää jotpan suomenkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-fi.png')
      })
    })

    await JotpaTest.step('Sähköpostissa', async () => {
      const newHakemusEmail = (await pollUntilNewHakemusEmailArrives(avustushakuID, buffyEmail))[0]

      console.log(newHakemusEmail)
      await JotpaTest.step('oph on korvattu jotpalla niiltä osin kuin on sovittu', async () => {
        expect(newHakemusEmail['from-address']).toEqual('no-reply@jotpa.fi')

        expect(newHakemusEmail.formatted).not.toContain("voitte olla yhteydessä osoitteeseen valtionavustukset@oph.fi")
        expect(newHakemusEmail.formatted).toContain("voitte olla yhteydessä osoitteeseen rahoitus@jotpa.fi")

        expect(newHakemusEmail.formatted).not.toContain(
`Opetushallitus
Hakaniemenranta 6`)
        expect(newHakemusEmail.formatted).toContain(
`Jatkuvan oppimisen ja työllisyyden palvelukeskus
Hakaniemenranta 6`)

        expect(newHakemusEmail.formatted).not.toContain("etunimi.sukunimi@oph.fi")
        expect(newHakemusEmail.formatted).toContain("etunimi.sukunimi@jotpa.fi")
      })
    })
  })

  await JotpaTest.step('Ruotsinkielisellä hakemuksella', async () => {
    await hakijaAvustusHakuPage.navigate(avustushakuID, 'sv')
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      faithEmail
    )

    await JotpaTest.step('Etusivulla', async () => {
      await JotpaTest.step('Näyttää jotpan ruotsinkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-sv.png')
      })
    })

    await JotpaTest.step('Hakemussivulla', async () => {
      await page.goto(hakemusUrl)
      await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

      await JotpaTest.step('Näyttää jotpan ruotsinkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-sv.png')
      })
    })

    await JotpaTest.step('Sähköpostissa', async () => {
      const newHakemusEmail = (await pollUntilNewHakemusEmailArrives(avustushakuID, faithEmail))[0]

      await JotpaTest.step('oph on korvattu jotpalla niiltä osin kuin on sovittu', async () => {
        expect(newHakemusEmail['from-address']).toEqual('no-reply@jotpa.fi')

        expect(newHakemusEmail.formatted).not.toContain("per e-post på adressen statsunderstod@oph.fi")
        expect(newHakemusEmail.formatted).toContain("per e-post på adressen rahoitus@jotpa.fi")

        expect(newHakemusEmail.formatted).not.toContain(
`Utbildningsstyrelsen
Hagnäskajen 6`)
        expect(newHakemusEmail.formatted).toContain(
`Servicecentret för kontinuerligt lärande och sysselsättning
Hagnäskajen 6`)

        expect(newHakemusEmail.formatted).not.toContain("fornamn.efternamn@oph.fi")
        expect(newHakemusEmail.formatted).toContain("fornamn.efternamn@jotpa.fi")
      })
    })
  })
})
