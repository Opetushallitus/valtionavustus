import { muutoshakemusTest } from './muutoshakemusTest'
import { expectToBeDefined } from '../utils/util'
import { dummyPdfPath, VIRKAILIJA_URL } from '../utils/constants'
import { VirkailijaValiselvitysPage } from '../pages/virkailijaValiselvitysPage'
import { navigate } from '../utils/navigate'

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

      await page.fill(`[name='organization']`, "Avustuksen saajan nimi")
      await page.fill(`[name='project-name']`, "Hankkeen nimi")

      await page.fill(`[name='project-description.project-description-1.goal']`, "Hankkeen/toiminnan tavoite")
      await page.fill(`[name='project-description.project-description-1.activity']`, "Toiminta, jolla tavoitteeseen on pyritty")
      await page.fill(`[name='project-description.project-description-1.result']`, "Konkreettiset tulokset, jotka tavoitteen osalta saavutettiin")

      await page.fill(`[name='textArea-1']`, "Miten hankkeen toimintaa, tuloksia ja vaikutuksia on arvioitu?")
      await page.fill(`[name='textArea-3']`, "Miten hankkeesta/toiminnasta on tiedotettu?")

      await page.click("label[for='project-outcomes.project-outcomes-1.outcome-type.radio.1']")
      await page.fill(`[name='project-outcomes.project-outcomes-1.description']`, "Kuvaus")
      await page.fill(`[name='project-outcomes.project-outcomes-1.address']`, "Saatavuustiedot, www-osoite tms.")
      await page.click("label[for='radioButton-good-practices.radio.1']")
      await page.fill(`[name='textArea-4']`, "Lisätietoja")
      await page.setInputFiles("[name='namedAttachment-0']", dummyPdfPath)

      await page.click('button#submit:not([disabled])')
      await page.waitForSelector(`#submit:has-text("Väliselvitys lähetetty")`)

      userKey = new URL(page.url()).searchParams.get('valiselvitys')
    })
    expectToBeDefined(userKey)
    await use({ userKey })
  },
})
