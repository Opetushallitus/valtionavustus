import { expect, PlaywrightTestArgs } from '@playwright/test'
import { MuutoshakemusFixtures, muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { Installment } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { DefaultValueFixtures } from '../../fixtures/defaultValues'

type TestArgs = PlaywrightTestArgs & DefaultValueFixtures & MuutoshakemusFixtures

const testSendingPaatos = async ({
  page,
  closedAvustushaku: { id: avustushakuID },
  answers,
  ukotettuValmistelija,
  projektikoodi,
}: TestArgs) => {
  const projectName = answers.projectName
  if (!projectName) {
    throw new Error('projectName must be set in order to accept avustushaku')
  }
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
    avustushakuID,
    projectName,
    projektikoodi,
  })

  const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
  await haunTiedotPage.resolveAvustushaku()

  const paatosPage = await haunTiedotPage.common.switchToPaatosTab()
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
