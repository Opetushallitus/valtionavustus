import { expect } from '@playwright/test'
import { muutoshakemusTest } from './muutoshakemusTest'
import { expectToBeDefined } from '../utils/util'
import { dummyPdfPath, VIRKAILIJA_URL } from '../utils/constants'
import { VirkailijaValiselvitysPage } from '../pages/virkailijaValiselvitysPage'
import { navigate } from '../utils/navigate'
import {HakijaSelvitysPage} from "../pages/hakijaSelvitysPage";

type VäliselvitysFixtures = {
  väliselvityspyyntöSent: {}
  väliselvitysSubmitted: {
    userKey: string
  }
}

export const väliselvitysTest = muutoshakemusTest.extend<VäliselvitysFixtures>({
  väliselvityspyyntöSent: async ({page, avustushakuID, acceptedHakemus}, use) => {
    await muutoshakemusTest.step('Send väliselvityspyynnöt', async () => {
      expectToBeDefined(acceptedHakemus)
      await page.goto(`${VIRKAILIJA_URL}/admin/valiselvitys/?avustushaku=${avustushakuID}`)
      await Promise.all([
        page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/send-notification`),
        page.click('[data-test-id="send-valiselvitys"]'),
      ])
    })
    await use({})
  },
  väliselvitysSubmitted: async ({page, avustushakuID, acceptedHakemus, väliselvityspyyntöSent}, use) => {
    let userKey: string | null = null
    await muutoshakemusTest.step('Fill in and submit väliselvitys', async () => {
      expectToBeDefined(väliselvityspyyntöSent)
      const valiselvitysPage = VirkailijaValiselvitysPage(page)
      await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, acceptedHakemus.hakemusID)
      const väliselvitysFormUrl = await page.getAttribute('[data-test-id="selvitys-link"]', 'href')
      if (!väliselvitysFormUrl) throw Error("valiselvitys form url not found")
      await navigate(page, väliselvitysFormUrl)
      const hakijaSelvitysPage = HakijaSelvitysPage(page)
      await hakijaSelvitysPage.organization.fill("Avustuksen saajan nimi")
      await hakijaSelvitysPage.projectName.fill("Hankkeen nimi")

      await hakijaSelvitysPage.projectGoal.fill("Hankkeen/toiminnan tavoite")
      await hakijaSelvitysPage.projectActivity.fill("Toiminta, jolla tavoitteeseen on pyritty")
      await hakijaSelvitysPage.projectResult.fill("Konkreettiset tulokset, jotka tavoitteen osalta saavutettiin")

      await hakijaSelvitysPage.textArea(1).fill("Miten hankkeen toimintaa, tuloksia ja vaikutuksia on arvioitu?")
      await hakijaSelvitysPage.textArea(3).fill("Miten hankkeesta/toiminnasta on tiedotettu?")

      await hakijaSelvitysPage.outcomeTypeRadioButtons.report.click()
      await hakijaSelvitysPage.outcomeDescription.fill("Kuvaus")
      await hakijaSelvitysPage.outcomeAddress.fill("Saatavuustiedot, www-osoite tms.")
      await hakijaSelvitysPage.goodPracticesRadioButtons.no.click()
      await hakijaSelvitysPage.textArea(4).fill("Lisätietoja")
      await hakijaSelvitysPage.firstAttachment.setInputFiles(dummyPdfPath)

      await hakijaSelvitysPage.valiselvitysWarning.waitFor({state: 'detached'})
      await expect(hakijaSelvitysPage.submitButton).toHaveText("Lähetä käsiteltäväksi")
      await hakijaSelvitysPage.submitButton.click()
      await expect(hakijaSelvitysPage.submitButton).toHaveText("Väliselvitys lähetetty")
      await hakijaSelvitysPage.submitButton.isDisabled()
      await hakijaSelvitysPage.valiselvitysWarning.waitFor({state: 'detached'})

      userKey = new URL(page.url()).searchParams.get('valiselvitys')
    })
    expectToBeDefined(userKey)
    await use({ userKey })
  },
})
