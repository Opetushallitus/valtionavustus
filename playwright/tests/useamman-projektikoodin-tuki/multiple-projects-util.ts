import { Page } from '@playwright/test'
import { HakuProps } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HaunTiedotPage } from '../../pages/virkailija/hakujen-hallinta/HaunTiedotPage'

export async function alustaAvustushaunTaytto(page: Page, hakuProps: HakuProps) {
  const hakujenHallintaPage = new HakujenHallintaPage(page)

  const { avustushakuName, registerNumber } = hakuProps
  console.log(`Avustushaku name for test: ${avustushakuName}`)

  const avustushakuID = await hakujenHallintaPage.copyEsimerkkihaku()
  console.log(`Avustushaku ID: ${avustushakuID}`)

  const haunTiedotPage = HaunTiedotPage(page)

  await haunTiedotPage.locators.registerNumber.fill(registerNumber)
  await haunTiedotPage.locators.hakuName.fi.fill(avustushakuName)
  await haunTiedotPage.locators.hakuName.sv.fill(avustushakuName + ' på svenska')

  if (hakuProps.vaCodes) {
    await haunTiedotPage.selectCode('operational-unit', hakuProps.vaCodes.operationalUnit)
  }
  return haunTiedotPage
}
