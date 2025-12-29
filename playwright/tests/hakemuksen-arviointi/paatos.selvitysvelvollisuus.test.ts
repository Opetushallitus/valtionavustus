import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { expect } from '@playwright/test'
import { HakijaPaatosPage } from '../../pages/hakija/HakijaPaatosPage'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import { waitForSave } from '../../pages/virkailija/hakujen-hallinta/CommonHakujenHallintaPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

const test = muutoshakemusTest.extend({
  acceptedHakemus: async (
    {
      closedAvustushaku,
      submittedHakemus: { userKey },
      page,
      ukotettuValmistelija,
      answers,
      projektikoodi,
      codes,
    },
    use,
    testInfo
  ) => {
    const avustushakuID = closedAvustushaku.id
    testInfo.setTimeout(testInfo.timeout + 25_000)

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    let hakemusID: number = 0
    await test.step('Accept hakemus', async () => {
      const projectName = answers.projectName
      if (!projectName) {
        throw new Error('projectName must be set in order to accept avustushaku')
      }
      hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
        avustushakuID,
        projectName,
        projektikoodi,
        codes,
      })
    })
    await test.step('Add valmistelija for hakemus', async () => {
      await hakemustenArviointiPage.closeHakemusDetails()
      await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)
    })

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await test.step('Resolve avustushaku', async () => {
      const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
      await haunTiedotPage.resolveAvustushaku()
    })

    await use({ hakemusID, userKey })
  },
})

test.describe('päätöksen selvitysvelvollisuus-osio', () => {
  test('ei näy jos toimituspäivämääriä tai selvitysvelvollisuus-tekstikenttää ei ole täytetty', async ({
    avustushakuID,
    acceptedHakemus,
    page,
  }) => {
    await test.step('Send päätökset', async () => {
      const paatosPage = PaatosPage(page)
      await paatosPage.navigateTo(avustushakuID)
      await paatosPage.sendPaatos()
    })

    const hakijaPaatosPage = HakijaPaatosPage(page)
    await hakijaPaatosPage.navigate(acceptedHakemus.hakemusID)

    await hakijaPaatosPage.paatosHeaderTitle.waitFor()
    await expect(page.getByRole('heading', { name: 'Selvitysvelvollisuus' })).not.toBeVisible()
  })
  test('on muotoiltu oikein', async ({ avustushakuID, acceptedHakemus, page }) => {
    await test.step('Send päätökset', async () => {
      const paatosPage = PaatosPage(page)
      await paatosPage.navigateTo(avustushakuID)
      const selvitysvelvollisuus = `Avustuksen käytöstä tulee tehdä Opetushallitukselle loppuselvitys kahden kuukauden kuluessa hankkeen päättymisestä tai viimeistään 30.9.2027.
 Hankkeen tulee pyydettäessä kuvata siinä syntyneitä tuotoksia ja käytäntöjä Opetushallituksen erikseen osoittamassa palvelussa.`
      await paatosPage.locators.selvitysvelvollisuus.fill(selvitysvelvollisuus)
      await waitForSave(page)
      await paatosPage.sendPaatos()
    })
    const hakijaPaatosPage = HakijaPaatosPage(page)
    await hakijaPaatosPage.navigate(acceptedHakemus.hakemusID)

    await hakijaPaatosPage.paatosHeaderTitle.waitFor()
    await expect(page.getByRole('heading', { name: 'Selvitysvelvollisuus' })).toBeVisible()
    expect(page.getByText('Avustuksen käytöstä tulee')).toMatchAriaSnapshot(
      `- paragraph: Avustuksen käytöstä tulee tehdä Opetushallitukselle loppuselvitys kahden kuukauden kuluessa hankkeen päättymisestä tai viimeistään 30.9.2027.`
    )
  })
})
