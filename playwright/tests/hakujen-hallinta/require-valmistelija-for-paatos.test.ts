import { expect, PlaywrightTestArgs } from '@playwright/test'
import { MuutoshakemusFixtures, muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import { HakujenHallintaPage, Installment } from '../../pages/hakujenHallintaPage'
import { DefaultValueFixtures } from '../../fixtures/defaultValues'

type TestArgs = PlaywrightTestArgs & DefaultValueFixtures & MuutoshakemusFixtures

const testSendingPaatos = async ({
  page,
  closedAvustushaku: { id: avustushakuID },
  answers,
  ukotettuValmistelija,
  projektikoodi,
}: TestArgs) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
    avustushakuID,
    projectName: answers.projectName,
    projektikoodi,
  })

  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await hakujenHallintaPage.navigateFromHeader()
  await hakujenHallintaPage.resolveAvustushaku()

  const paatosPage = await hakujenHallintaPage.switchToPaatosTab()
  await expect(paatosPage.locators.paatosSendError).toBeHidden()

  await paatosPage.locators.sendPaatokset().click()
  await paatosPage.locators.confirmSending.click()
  await expect(paatosPage.locators.paatosSendError).toHaveText(
    `Hakemukselle numero ${hakemusID} ei ole valittu valmistelijaa. Päätöksiä ei lähetetty.`
  )

  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)

  await paatosPage.navigateTo(avustushakuID)
  await paatosPage.sendPaatos()
}

const singleTest = muutoshakemusTest.extend({
  hakuProps: async ({ hakuProps }, use) => {
    await use({ ...hakuProps, installment: Installment.OneInstallment })
  },
})

singleTest('require valmistelija when single maksuerä', testSendingPaatos)

const multipleTest = muutoshakemusTest.extend({
  hakuProps: async ({ hakuProps }, use) => {
    await use({ ...hakuProps, installment: Installment.MultipleInstallments })
  },
})

multipleTest('require valmistelija when multiple maksuerä', testSendingPaatos)
