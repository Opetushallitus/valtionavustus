import { expect, test } from '@playwright/test'
import moment from 'moment'

import { yhteishankeTest } from './yhteishankeTest'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { PaatosPage } from '../pages/virkailija/hakujen-hallinta/PaatosPage'
import { getHakemusTokenAndRegisterNumber } from '../utils/emails'
import { otherOrganization } from '../utils/yhteishanke'

export const yhteishankeInitialOrgs = {
  first: {
    name: 'Ensimmäinen Organisaatio Oy',
    contactPerson: 'Eka Henkilö',
    email: 'eka@ensimmainen.fi',
  },
  second: {
    name: 'Toinen Organisaatio Oy',
    contactPerson: 'Toka Henkilö',
    email: 'toka@toinen.fi',
  },
}

export interface YhteishankeMuutoshakemusFixtures {
  acceptedYhteishankeHakemus: { hakemusID: number; registerNumber: string }
}

export const yhteishankeMuutoshakemusTest =
  yhteishankeTest.extend<YhteishankeMuutoshakemusFixtures>({
    acceptedYhteishankeHakemus: async (
      {
        page,
        submittedHakemusUrl,
        answers,
        projektikoodi,
        codes,
        ukotettuValmistelija,
        avustushakuID,
      },
      use,
      testInfo
    ) => {
      testInfo.setTimeout(testInfo.timeout + 30_000)

      await test.step('create and submit a yhteishanke hakemus with two organisations', async () => {
        const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
        const first = otherOrganization(page, 0)
        const second = otherOrganization(page, 1)

        await page.goto(submittedHakemusUrl)
        await page.locator("[for='combined-effort.radio.0']").click()
        await expect(first.name).toBeVisible()

        await first.name.fill(yhteishankeInitialOrgs.first.name)
        await first.contactPerson.fill(yhteishankeInitialOrgs.first.contactPerson)
        await first.email.fill(yhteishankeInitialOrgs.first.email)

        await expect(second.name).toBeEnabled()
        await second.name.fill(yhteishankeInitialOrgs.second.name)
        await second.contactPerson.fill(yhteishankeInitialOrgs.second.contactPerson)
        await second.email.fill(yhteishankeInitialOrgs.second.email)

        await page.locator("[id='project-costs-row.amount']").fill('20000')
        await page.locator("[for='type-of-organization.radio.0']").click()
        await page.locator("[id='signature']").fill('Erkki Esimerkki')
        await page.locator("[id='signature-email']").fill('erkki@example.com')
        await page.locator('#bank-iban').fill('FI95 6682 9530 0087 65')
        await page.locator('#bank-bic').fill('OKOYFIHH')

        await hakijaAvustusHakuPage.waitForEditSaved()
        await hakijaAvustusHakuPage.submitApplication()
      })

      let hakemusID = 0
      let registerNumber = ''

      await test.step('accept hakemus and send paatos so muutoshakemus link is available', async () => {
        const hakujenHallintaPage = new HakujenHallintaPage(page)
        const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
        await haunTiedotPage.setEndDate(moment().subtract(1, 'year').format('D.M.YYYY H.mm'))

        const hakemustenArviointiPage = new HakemustenArviointiPage(page)
        await hakemustenArviointiPage.navigate(avustushakuID)
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

        await hakemustenArviointiPage.closeHakemusDetails()
        await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)

        const resolvedHaunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
        await resolvedHaunTiedotPage.resolveAvustushaku()

        const paatosPage = PaatosPage(page)
        await paatosPage.navigateTo(avustushakuID)
        await paatosPage.sendPaatos()

        registerNumber = (await getHakemusTokenAndRegisterNumber(hakemusID))['register-number']
      })

      await use({ hakemusID, registerNumber })
    },
  })
