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
  lastOrFail,
  waitUntilMinEmails,
} from '../../utils/emails'
import { waitForNewTab } from '../../utils/util'

test.describe.parallel('Avustushaku that was marked as muutoshakukelvoton', () => {
  test('turns into muutoshakukelpoinen when copied', async ({ avustushakuID, page }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(avustushakuID)
    const newAvustushakuId = await hakujenHallintaPage.copyCurrentHaku()

    expect(page.url()).toContain(String(newAvustushakuId))
    await expect(page.locator('[data-test-id="muutoshakukelvoton-warning"]')).toBeHidden()
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

  test('has link to yhteystietojen muokkauslomake instead of muutoshakemuslomake in muutoshakemukset tab', async ({
    avustushakuID,
    acceptedHakemus: { userKey },
    page,
  }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await hakemustenArviointiPage.tabs().muutoshakemus.click()

    const newPagePromise = waitForNewTab(page)
    await page.getByTestId('yhteystietojen-muokkaus-link').click()
    const modificationPage = await newPagePromise

    await modificationPage.bringToFront()
    expect(await modificationPage.evaluate(() => window.location.href)).toMatch(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?lang=fi&hakemus=${userKey}&modify-application=true`
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

  test('hakija can change yhteyshenkilö', async ({
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
    await expect(page.getByRole('heading', { name: 'Hakemus', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Haettavat muutokset' })).not.toBeVisible()
    await hakemusEditPage.changeHakijaNameToEtunimiTakanimi()
  })
})
