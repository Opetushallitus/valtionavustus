import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { expectToBeDefined } from '../../../utils/util'
import { HakujenHallintaPage } from '../../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import moment from 'moment'
import { MaksatuksetPage } from '../../../pages/virkailija/hakujen-hallinta/maksatuksetPage'
import { PaatosPage } from '../../../pages/virkailija/hakujen-hallinta/PaatosPage'

const formattedMoment = () => moment(new Date()).format('DD.MM.YYYY')
const valiselvitysDeadline = '01.01.2023'
const loppuselvitysDeadline = '20.04.2023'

test(`hakemusten arviointi additional info`, async ({
  page,
  avustushakuID,
  avustushakuName,
  closedAvustushaku,
  answers,
  codes,
  projektikoodi,
}) => {
  expectToBeDefined(closedAvustushaku)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID, {
    showAdditionalInfo: true,
  })
  const { locators } = hakemustenArviointiPage.additionalInfo()

  await test.step('shows no budget if there are no accepted hakemuses', async () => {
    await expect(locators.budjetti).toHaveText('-')
  })

  const projectName = answers.projectName
  if (!projectName) {
    throw new Error('projectName must be set in order to accept avustushaku')
  }
  await hakemustenArviointiPage.acceptAvustushaku({
    avustushakuID,
    projectName,
    projektikoodi,
  })

  await hakemustenArviointiPage.page.locator('a:text("×")').click()
  await expect(locators.vastuuvalmistelija).toHaveText('_ valtionavustus')

  await test.step('shows correct toimintayksikkö', async () => {
    await expect(locators.toimintayksikko).toHaveText(`Toimintayksikkö ${codes.operationalUnit}`)
  })

  await test.step('updates paatos to show when it was sent', async () => {
    await expect(locators.paatokset).toHaveText('Ei lähetetty')
    await hakemustenArviointiPage.page
      .locator('[aria-label="Lisää valmistelija hakemukselle"]')
      .click()
    await hakemustenArviointiPage.page
      .locator('[aria-label="Lisää _ valtionavustus valmistelijaksi"]')
      .click()
    await hakemustenArviointiPage.waitForSave()
    await hakemustenArviointiPage.closeUkotusModal()
    const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
    await haunTiedotPage.resolveAvustushaku()
    const paatosPage = await hakujenHallintaPage.commonHakujenHallinta.switchToPaatosTab()
    await paatosPage.sendPaatos()

    await hakemustenArviointiPage.navigate(avustushakuID, {
      showAdditionalInfo: true,
    })
    await expect(locators.paatokset).toHaveText(formattedMoment())
  })

  await test.step('updates maksatukset to show when it was sent', async () => {
    await expect(locators.maksatukset).toHaveText('Ei lähetetty')
    const maksatuksetPage = MaksatuksetPage(page)
    await maksatuksetPage.goto(avustushakuName)
    await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()
    await hakemustenArviointiPage.navigate(avustushakuID, {
      showAdditionalInfo: true,
    })
    await expect(locators.maksatukset).toHaveText(formattedMoment())
  })

  await test.step('updates vali and loppuselvitys to show when it has a deadline', async () => {
    await expect(locators.valiselvitykset).toHaveText('-')
    await expect(locators.loppuselvitykset).toHaveText('-')

    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.setValiselvitysDate(valiselvitysDeadline)
    await paatosPage.setLoppuselvitysDate(loppuselvitysDeadline)
    await paatosPage.waitForSave()

    await hakemustenArviointiPage.navigate(avustushakuID, {
      showAdditionalInfo: true,
    })
    await expect(locators.valiselvitykset).toHaveText(`Ei lähetetty (DL ${valiselvitysDeadline})`)
    await expect(locators.loppuselvitykset).toHaveText(`Ei lähetetty (DL ${loppuselvitysDeadline})`)
  })

  await test.step('update vali and loppuselvitys to show when they were sent', async () => {
    const valiselvitysPage = await hakujenHallintaPage.navigateToValiselvitys(avustushakuID)
    await valiselvitysPage.sendValiselvitys()

    await hakujenHallintaPage.switchToLoppuselvitysTab()
    await hakujenHallintaPage.page.click('text="Lähetä loppuselvityspyynnöt"')
    await hakujenHallintaPage.page.locator('text="Lähetetty 1 viestiä"').waitFor()

    await hakemustenArviointiPage.navigate(avustushakuID, {
      showAdditionalInfo: true,
    })
    await expect(locators.valiselvitykset).toHaveText(formattedMoment())
    await expect(locators.loppuselvitykset).toHaveText(formattedMoment())
  })

  await test.step('shows is muutoshakukelpoinen', async () => {
    await expect(locators.muutoshakukelpoinen).toHaveText('Kyllä')
  })

  await test.step('shows Kokonaiskustannus as budget if an accepted hakemus has it', async () => {
    await expect(locators.budjetti).toHaveText('Kokonaiskustannus')
  })

  await test.step('can close additional info', async () => {
    await locators.muutoshakukelpoinen.waitFor()
    await locators.showAdditionalInfo.waitFor({ state: 'detached' })
    await locators.hideAdditionalInfo.click()
    await locators.muutoshakukelpoinen.waitFor({ state: 'detached' })
    await locators.hideAdditionalInfo.waitFor({ state: 'detached' })
    await locators.showAdditionalInfo.waitFor()
  })
})
