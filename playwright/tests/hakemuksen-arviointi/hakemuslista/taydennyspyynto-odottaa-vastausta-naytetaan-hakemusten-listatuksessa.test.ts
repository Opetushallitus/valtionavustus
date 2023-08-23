import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../../fixtures/muutoshakemusTest'

import { HakemustenArviointiPage } from '../../../pages/hakemustenArviointiPage'

test('Täydennyspyyntö odottaa vastausta näytetään hakemusten listauksessa', async ({
  closedAvustushaku,
  page,
  submittedHakemus: { userKey },
  answers,
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 25_000)

  expect(userKey).toBeDefined()
  const avustushakuID = closedAvustushaku.id

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await hakemustenArviointiPage.navigate(avustushakuID)

  await Promise.all([page.waitForNavigation(), page.click(`text=${answers.projectName}`)])
  const hakemusID = await hakemustenArviointiPage.getHakemusID()

  await test.step('Varmista että ennen täydennyspyyntöä hakemukselta ei odoteta täydennystä', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(
      hakemustenArviointiPage.page.getByTestId(`taydennyspyynto-odottaa-vastausta-${hakemusID}`)
    ).toHaveCount(0)
  })

  await test.step('Varmista lisäksi, että ennen täydennyspyynön perumista hakemuksen täydennyspyyntöön ei ole vastattu', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(
      hakemustenArviointiPage.page.getByTestId(`taydennyspyyntoon-vastattu-${hakemusID}`)
    ).toHaveCount(0)
  })

  await test.step('Tee täydennyspyyntö', async () => {
    await Promise.all([page.waitForNavigation(), page.click(`text=${answers.projectName}`)])

    const täydennyspyyntöText =
      'Lisää turklesia ja turpaanvetoja; vähemmän koulutusuudistusta. Cowabungaa veli!!'
    await hakemustenArviointiPage.createChangeRequest(täydennyspyyntöText)
  })

  await test.step('Hakemukselta odotetaan täydennystä ja se indikoidaan listauksessa', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(
      hakemustenArviointiPage.page.getByTestId(`taydennyspyynto-odottaa-vastausta-${hakemusID}`)
    ).toHaveCount(1)
  })

  await test.step('Peru täydennyspyyntö', async () => {
    await Promise.all([page.waitForNavigation(), page.click(`text=${answers.projectName}`)])
    await hakemustenArviointiPage.cancelChangeRequest()
  })

  await test.step('Hakemuksen taydennyspyyntöön on vastattu ja se indikoidaan listauksessa', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(
      hakemustenArviointiPage.page.getByTestId(`taydennyspyyntoon-vastattu-${hakemusID}`)
    ).toHaveCount(1)
  })
})
