import { expect, test } from '@playwright/test'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HaunTiedotPage } from '../../pages/virkailija/hakujen-hallinta/HaunTiedotPage'
import { getTäydennyspyyntöEmails, waitUntilMinEmails } from '../../utils/emails'
import { switchUserIdentityTo } from '../../utils/util'
import { createJotpaCodes } from '../../fixtures/JotpaTest'

const jotpaVirkailijaTest = muutoshakemusTest.extend({
  codes: async ({ page }, use) => {
    const codes = await createJotpaCodes(page)
    await use(codes)
  },
  closedAvustushaku: async (
    { page, avustushakuID, submittedHakemus, finalAvustushakuEndDate },
    use
  ) => {
    expect(submittedHakemus).toBeDefined()

    await test.step('Add jotpakayttaja as valmistelija', async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      await hakujenHallintaPage.navigate(avustushakuID)
      const haunTiedotPage = HaunTiedotPage(page)
      await haunTiedotPage.addValmistelija('Jotpa Käyttäjä')
    })

    await test.step('Close avustushaku', async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
      await haunTiedotPage.setEndDate(finalAvustushakuEndDate.format('D.M.YYYY H.mm'))
    })

    await use({ id: avustushakuID })
  },
})

jotpaVirkailijaTest(
  'JOTPA virkailija with jotpa.fi email can send täydennyspyyntö',
  async ({ page, closedAvustushaku }) => {
    const avustushakuID = closedAvustushaku.id

    await switchUserIdentityTo(page, 'jotpakayttaja')

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)

    const hakemusID = await hakemustenArviointiPage.getHakemusID()

    const täydennyspyyntöText = 'Voisitteko täydentää hakemustanne?'
    await hakemustenArviointiPage.fillTäydennyspyyntöField(täydennyspyyntöText)
    await hakemustenArviointiPage.clickToSendTäydennyspyyntö(avustushakuID, hakemusID)

    const emails = await waitUntilMinEmails(getTäydennyspyyntöEmails, 1, hakemusID)

    expect(emails[0]['bcc']).toStrictEqual('jotpa.kayttaja@jotpa.fi')

    expect(emails[0].formatted).toContain('jotpa.kayttaja@jotpa.fi')
  }
)
