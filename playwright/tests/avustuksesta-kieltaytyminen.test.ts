import { expect } from '@playwright/test'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { RefusePage } from '../pages/hakija/refuse-page'
import {
  getAvustushakuRefusedEmails,
  getLoppuselvitysEmailsForAvustus,
  getValiselvitysEmailsForAvustus,
  waitUntilMinEmails,
} from '../utils/emails'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { twoAcceptedHakemusTest as test } from '../fixtures/twoHakemusTest'
import { expectIsFinnishOphEmail } from '../utils/email-signature'

test('Avustuksesta kieltäytyminen', async ({
  page,
  avustushakuID,
  acceptedHakemukset: { hakemusID, secondHakemusID },
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 40_000)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await test.step('send päätökset', async () => {
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.resolveAvustushaku()
    const paatosPage = await hakujenHallintaPage.commonHakujenHallinta.switchToPaatosTab()
    await paatosPage.sendPaatos(2)
  })

  await test.step('refuse first hakemus', async () => {
    const refusePage = RefusePage(page)
    await refusePage.navigate(hakemusID)
    await refusePage.refuseGrant()
  })

  await test.step('Hakija receives email', async () => {
    const emails = await waitUntilMinEmails(getAvustushakuRefusedEmails, 1, hakemusID)
    const email = emails[0]

    await test.step('with correct body', async () => {
      expect(email.formatted).toContain(
        'Ilmoitus avustuksenne vastaanottamatta jättämisestä on lähetetty Opetushallitukseen.'
      )
      await expectIsFinnishOphEmail(email)
    })
    await test.step('with correct from-address', async () => {
      expect(email['from-address']).toBe('no-reply@valtionavustukset.oph.fi')
    })
  })

  await test.step('Hakemus list shows both refused and accepted application', async () => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)

    const refusedHakemus = hakemustenArviointiPage.page
      .locator('tbody')
      .getByTestId(`hakemus-${hakemusID}`)
    const secondHakemus = hakemustenArviointiPage.page
      .locator('tbody')
      .getByTestId(`hakemus-${secondHakemusID}`)

    const hakemusStatusSelector = '.hakemus-status-cell'
    await expect(refusedHakemus.locator(hakemusStatusSelector)).toHaveText('Ei tarvetta')
    await expect(secondHakemus.locator(hakemusStatusSelector)).toHaveText('Hyväksytty')

    const muutoshakemusSelector = '[data-test-class=muutoshakemus-status-cell]'
    await expect(refusedHakemus.locator(muutoshakemusSelector)).toHaveText('-')
    await expect(secondHakemus.locator(muutoshakemusSelector)).toHaveText('-')

    await expect(hakemustenArviointiPage.getVäliselvitysStatus(hakemusID)).toHaveText('-')
    await expect(hakemustenArviointiPage.getVäliselvitysStatus(secondHakemusID)).toHaveText(
      'Puuttuu'
    )

    await expect(hakemustenArviointiPage.getLoppuselvitysStatus(hakemusID)).toHaveText('-')
    await expect(hakemustenArviointiPage.getLoppuselvitysStatus(secondHakemusID)).toHaveText(
      'Puuttuu'
    )
  })

  await test.step('sends only one väliselvityspyyntö', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigateFromHeader()
    const valiselvitysPage =
      await hakujenHallintaPage.commonHakujenHallinta.switchToValiselvitysTab()
    expect(await getValiselvitysEmailsForAvustus(avustushakuID)).toHaveLength(0)
    await valiselvitysPage.sendValiselvitys(1)
    expect(await getValiselvitysEmailsForAvustus(avustushakuID)).toHaveLength(1)
  })

  await test.step('sends only one loppuselvityspyyntö', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigateFromHeader()
    const loppuselvitysTab =
      await hakujenHallintaPage.commonHakujenHallinta.switchToLoppuselvitysTab()
    expect(await getLoppuselvitysEmailsForAvustus(avustushakuID)).toHaveLength(0)
    await loppuselvitysTab.sendSelvitysPyynnot(1)
    expect(await getLoppuselvitysEmailsForAvustus(avustushakuID)).toHaveLength(1)
  })
})
