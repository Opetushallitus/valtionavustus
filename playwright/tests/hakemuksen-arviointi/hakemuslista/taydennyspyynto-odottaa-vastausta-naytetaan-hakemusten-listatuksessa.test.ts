import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../../fixtures/muutoshakemusTest'

import { HakemustenArviointiPage } from '../../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { getTäydennyspyyntöEmails, waitUntilMinEmails } from '../../../utils/emails'
import { expectIsFinnishOphEmail } from '../../../utils/email-signature'

test('Täydennyspyyntö odottaa vastausta näytetään hakemusten listauksessa', async ({
  closedAvustushaku,
  page,
  submittedHakemus: { userKey },
  answers,
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 25_000)

  expect(userKey).toBeDefined()
  const avustushakuID = closedAvustushaku.id

  const projectName = answers.projectName
  if (!projectName) {
    throw new Error('projectName must be set in order to select hakemus')
  }

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(projectName)
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
    await hakemustenArviointiPage.selectHakemusFromList(projectName)

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
    await hakemustenArviointiPage.selectHakemusFromList(projectName)
    await hakemustenArviointiPage.cancelChangeRequest()
  })

  await test.step('Hakemuksen taydennyspyyntöön on vastattu ja se indikoidaan listauksessa', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(
      hakemustenArviointiPage.page.getByTestId(`taydennyspyyntoon-vastattu-${hakemusID}`)
    ).toHaveCount(1)
  })

  await test.step('Hakijalle lähetetään täydennyspyynnön sähköposti', async () => {
    const emails = await waitUntilMinEmails(getTäydennyspyyntöEmails, 1, hakemusID)
    const email = emails[0]
    await expectIsFinnishOphEmail(email)
    expect(email.subject).toMatch(/Täydennyspyyntö avustushakemukseesi/)
    expect(email.formatted).toMatch(/.*Pääset täydentämään avustushakemusta tästä linkistä.*/)
    expect(email['to-address']).toEqual(expect.arrayContaining(['erkki.esimerkki@example.com']))
  })
})
