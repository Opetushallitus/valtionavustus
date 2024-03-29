import { expect } from '@playwright/test'

import { muutoshakemuskelvotonTest as test } from '../../fixtures/muutoshakemuskelvotonTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HAKIJA_URL } from '../../utils/constants'
import {
  getAcceptedPäätösEmails,
  getHakemusTokenAndRegisterNumber,
  getYhteystiedotMuutettuEmails,
  lastOrFail,
  waitUntilMinEmails,
} from '../../utils/emails'
import { waitForNewTab } from '../../utils/util'
import { expectIsFinnishOphEmail } from '../../utils/email-signature'

test.describe.parallel('Avustushaku that was marked as muutoshakukelvoton', () => {
  test('turns into muutoshakukelpoinen when copied', async ({ avustushakuID, page }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(avustushakuID)
    const newAvustushakuId = await hakujenHallintaPage.copyCurrentHaku()

    expect(page.url()).toContain(String(newAvustushakuId))
    expect(await page.$('[data-test-id="muutoshakukelvoton-warning"]')).toBeNull()
  })

  test('shows warning on Haun tiedot tab', async ({ avustushakuID, page }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(avustushakuID)

    expect(
      await hakujenHallintaPage.page.textContent('[data-test-id="muutoshakukelvoton-warning"]')
    ).toEqual(
      'Huom.! Uusi muutoshakutoiminnallisuus ei ole käytössä tälle avustushaulle.' +
        'Avustushaun päätöksiin ei tule linkkiä uudelle muutoshakusivulle'
    )
  })

  test('does not send link to muutoshaku page with päätös', async ({
    avustushakuID,
    acceptedHakemus: { hakemusID },
  }) => {
    const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
    const email = lastOrFail(emails).formatted
    expect(email).not.toContain(`${HAKIJA_URL}/muutoshakemus`)
    expect(email).not.toContain(
      'Pääsette tekemään muutoshakemuksen sekä muuttamaan yhteyshenkilöä ja hänen yhteystietojaan koko hankekauden ajan tästä linkistä'
    )
    expect(email).toContain(
      'Yhteyshenkilö vaihdetaan oheisen linkin kautta, joka on käytettävissä läpi avustuksen käyttöajan:'
    )
    expect(email).toContain(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?avustushaku=${avustushakuID}`
    )
  })

  test('navigates to the old virkailija edit view', async ({
    avustushakuID,
    acceptedHakemus: { userKey },
    page,
  }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)

    await page.getByRole('button', { name: 'Muokkaa hakemusta' }).click()
    await page.getByTestId('virkailija-edit-comment').fill('Kuhan tässä nyt muokkaillaan')

    const newPagePromise = waitForNewTab(page)
    await page.getByRole('button', { name: 'Siirry muokkaamaan' }).click()
    const modificationPage = await newPagePromise

    await modificationPage.bringToFront()
    expect(await modificationPage.evaluate(() => window.location.href)).toMatch(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=${userKey}`
    )
    await page.bringToFront()
  })

  test('does not show link to muutoshaku in email preview', async ({
    avustushakuID,
    acceptedHakemus: { hakemusID },
    page,
  }) => {
    expect(hakemusID).toBeTruthy()
    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)
    const email = await page.textContent('.decision-email-content')

    expect(email).not.toContain(`${HAKIJA_URL}/muutoshakemus`)
    expect(email).not.toContain(
      'Pääsette tekemään muutoshakemuksen sekä muuttamaan yhteyshenkilöä ja hänen yhteystietojaan koko hankekauden ajan tästä linkistä'
    )
    expect(email).toContain(
      'Yhteyshenkilö vaihdetaan oheisen linkin kautta, joka on käytettävissä läpi avustuksen käyttöajan:'
    )
    expect(email).toContain(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?avustushaku=${avustushakuID}`
    )
  })

  test('sends a notification to hakija when yhteyshenkilö is changed', async ({
    avustushakuID,
    acceptedHakemus: { hakemusID, userKey },
    page,
  }) => {
    const { token } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const hakemusEditPage = await hakijaAvustusHakuPage.navigateToYhteyshenkilöChangePage(
      avustushakuID,
      userKey,
      token
    )
    await hakemusEditPage.changeHakijaNameToEtunimiTakanimi()

    const emails = await waitUntilMinEmails(getYhteystiedotMuutettuEmails, 1, hakemusID)

    expect(emails).toHaveLength(1)
    const email = emails[0]

    await test.step('the email has correct sender', async () => {
      expect(email['from-address']).toBe('no-reply@valtionavustukset.oph.fi')
    })

    await test.step('the email has correct body', async () => {
      expect(email.formatted).toContain(
        'Ilmoitus yhteystietojen muutoksesta on lähetetty Opetushallitukseen.'
      )

      await expectIsFinnishOphEmail(email)
    })
  })
})
