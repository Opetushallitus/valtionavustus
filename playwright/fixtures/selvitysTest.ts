import { muutoshakemusTest } from './muutoshakemusTest'
import { expectToBeDefined } from '../utils/util'
import { dummyPdfPath, VIRKAILIJA_URL } from '../utils/constants'
import { navigate } from '../utils/navigate'
import { HakijaSelvitysPage } from '../pages/hakija/hakijaSelvitysPage'
import { expect, test } from '@playwright/test'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { LoppuselvitysPage } from '../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { ValiselvitysPage } from '../pages/virkailija/hakujen-hallinta/ValiselvitysPage'

interface SelvitysFixtures {
  väliselvityspyyntöSent: {}
  väliselvitysSubmitted: {
    userKey: string
  }
  loppuselvityspyyntöSent: {}
  loppuselvitysSubmitted: {
    loppuselvitysFormFilled: boolean
    loppuselvitysFormUrl: string
  }
  asiatarkastus: {
    asiatarkastettu: boolean
  }
  taloustarkastus: {
    taloustarkastettu: boolean
  }
  valiAndLoppuselvitysSubmitted: {}
  valiselvitysYhteyshenkilo?: {
    email: string
    name: string
  }
  loppuselvitysYhteyshenkilo?: {
    email: string
    name: string
  }
}

export const selvitysTest = muutoshakemusTest.extend<SelvitysFixtures>({
  valiselvitysYhteyshenkilo: [undefined, { option: false }],
  loppuselvitysYhteyshenkilo: [undefined, { option: false }],

  väliselvityspyyntöSent: async (
    { page, avustushakuID, acceptedHakemus, ukotettuValmistelija },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 5_000)
    expectToBeDefined(acceptedHakemus)
    const hakujenHallinta = new HakujenHallintaPage(page)
    const valiselvitysPage = await hakujenHallinta.navigateToValiselvitys(avustushakuID)
    await muutoshakemusTest.step('Send väliselvityspyynnöt', async () => {
      await Promise.all([
        page.waitForResponse(
          `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/send-notification`
        ),
        page.waitForResponse(
          new RegExp(`/api/avustushaku/${avustushakuID}/tapahtumaloki/valiselvitys-notification$`)
        ),
        valiselvitysPage.sendValiselvitys(),
      ])
    })
    const tapahtumaloki = valiselvitysPage.tapahtumaloki
    await test.step('updates tapahtumaloki', async () => {
      await expect(tapahtumaloki.getByTestId('sender-0')).toHaveText(ukotettuValmistelija)
      await expect(tapahtumaloki.getByTestId('sent-0')).toHaveText('1')
    })
    await use({})
  },
  väliselvitysSubmitted: async (
    { page, avustushakuID, acceptedHakemus, väliselvityspyyntöSent, valiselvitysYhteyshenkilo },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)
    let userKey: string | null = null
    await muutoshakemusTest.step('Fill in and submit väliselvitys', async () => {
      expectToBeDefined(väliselvityspyyntöSent)
      const valiselvitysPage = ValiselvitysPage(page)
      await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, acceptedHakemus.hakemusID)
      const väliselvitysFormUrl = await valiselvitysPage.linkToHakemus.getAttribute('href')
      if (!väliselvitysFormUrl) throw Error('valiselvitys form url not found')
      await navigate(page, väliselvitysFormUrl)
      const hakijaSelvitysPage = HakijaSelvitysPage(page)

      await hakijaSelvitysPage.fillCommonValiselvitysForm()
      if (valiselvitysYhteyshenkilo) {
        await hakijaSelvitysPage.yheyshenkiloName.fill(valiselvitysYhteyshenkilo.name)
        await hakijaSelvitysPage.yheyshenkiloEmail.fill(valiselvitysYhteyshenkilo.email)
      }
      await expect(hakijaSelvitysPage.valiselvitysWarning).toBeHidden()
      const submitButtonText = /Lähetä käsiteltäväksi|Sänd för behandling/
      await expect(hakijaSelvitysPage.submitButton).toHaveText(submitButtonText)
      await hakijaSelvitysPage.submitButton.click()
      const selvitysSentText = /Väliselvitys lähetetty|Mellanredovisning sänd/
      await expect(hakijaSelvitysPage.submitButton).toHaveText(selvitysSentText)
      await expect(hakijaSelvitysPage.submitButton).toBeDisabled()
      await expect(hakijaSelvitysPage.valiselvitysWarning).toBeHidden()

      userKey = new URL(page.url()).searchParams.get('valiselvitys')
    })
    expectToBeDefined(userKey)
    await use({ userKey })
  },
  loppuselvityspyyntöSent: async ({ page, avustushakuID, acceptedHakemus }, use) => {
    expectToBeDefined(acceptedHakemus)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigateToLoppuselvitys(avustushakuID)
    const notSentIndicator = page.getByTestId('selvityspyynto-not-sent')
    await expect(notSentIndicator).toBeVisible()
    await Promise.all([
      page.waitForResponse(
        `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/loppuselvitys/send-notification`
      ),
      page.waitForResponse(
        new RegExp(`/api/avustushaku/${avustushakuID}/tapahtumaloki/loppuselvitys-notification$`)
      ),
      page.getByTestId('send-loppuselvitys').click(),
    ])
    const tapahtumaloki = page.locator('div.tapahtumaloki')
    await test.step('updates tapahtumaloki', async () => {
      await expect(tapahtumaloki.getByTestId('sender-0')).toHaveText('_ valtionavustus')
      await expect(tapahtumaloki.getByTestId('sent-0')).toHaveText('1')
    })
    await expect(notSentIndicator).toBeHidden()
    await use({})
  },
  loppuselvitysSubmitted: async (
    {
      page,
      loppuselvityspyyntöSent,
      avustushakuID,
      acceptedHakemus: { hakemusID },
      answers,
      loppuselvitysYhteyshenkilo,
    },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)
    expectToBeDefined(loppuselvityspyyntöSent)
    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    const loppuselvitysFormUrl = await loppuselvitysPage.getSelvitysFormUrl()

    await navigate(page, loppuselvitysFormUrl)
    const hakijaSelvitysPage = HakijaSelvitysPage(page)

    if (loppuselvitysYhteyshenkilo) {
      await hakijaSelvitysPage.yheyshenkiloName.fill(loppuselvitysYhteyshenkilo.name)
      await hakijaSelvitysPage.yheyshenkiloEmail.fill(loppuselvitysYhteyshenkilo.email)
    }

    await hakijaSelvitysPage.textArea(0).fill('Yhteenveto')
    await hakijaSelvitysPage.textArea(2).fill('Työn jako')
    await hakijaSelvitysPage.projectGoal.fill('Tavoite')
    await hakijaSelvitysPage.projectActivity.fill('Toiminta')
    await hakijaSelvitysPage.projectResult.fill('Tulokset')
    await hakijaSelvitysPage.textArea(1).fill('Arviointi')
    await hakijaSelvitysPage.textArea(3).fill('Tiedotus')

    await hakijaSelvitysPage.outcomeTypeRadioButtons.operatingModel.click()
    await hakijaSelvitysPage.outcomeDescription.fill('Kuvaus')
    await hakijaSelvitysPage.outcomeAddress.fill('Saatavuustiedot')

    await hakijaSelvitysPage.goodPracticesRadioButtons.no.click()
    await hakijaSelvitysPage.textArea(4).fill('Lisätietoja')

    await hakijaSelvitysPage.firstAttachment.setInputFiles(dummyPdfPath)

    const lang = answers.lang || 'fi'
    const submitButtonText = lang === 'fi' ? 'Lähetä käsiteltäväksi' : 'Sänd för behandling'
    const submittedText = lang === 'fi' ? 'Loppuselvitys lähetetty' : 'Slutredovisning sänd'
    await expect(hakijaSelvitysPage.submitButton).toHaveText(submitButtonText)
    await hakijaSelvitysPage.submitButton.click()
    await expect(hakijaSelvitysPage.submitButton).toHaveText(submittedText)
    await hakijaSelvitysPage.submitButton.isDisabled()

    await use({
      loppuselvitysFormUrl,
      loppuselvitysFormFilled: true,
    })
  },
  asiatarkastus: async (
    {
      page,
      avustushakuID,
      acceptedHakemus: { hakemusID },
      loppuselvitysSubmitted: { loppuselvitysFormFilled },
    },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 10_000)
    expect(loppuselvitysFormFilled)
    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    await loppuselvitysPage.asiatarkastaLoppuselvitys('Ei kommentoitavaa')
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeEnabled()
    await use({
      asiatarkastettu: true,
    })
  },
  taloustarkastus: async (
    {
      page,
      avustushakuID,
      acceptedHakemus: { hakemusID },
      loppuselvitysSubmitted: { loppuselvitysFormFilled },
      asiatarkastus: { asiatarkastettu },
    },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 10_000)
    expectToBeDefined(avustushakuID)
    expectToBeDefined(hakemusID)
    expect(asiatarkastettu)
    expect(loppuselvitysFormFilled)

    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.locators.taloustarkastus.accept.click()
    await page.getByTestId('taloustarkastus-email-subject').fill('Taloustarkastus OK')
    await page
      .getByTestId('taloustarkastus-email-content')
      .fill('Taloustarkastus OK sähköposti content')
    await loppuselvitysPage.locators.taloustarkastus.confirmAcceptance.click()
    await expect(loppuselvitysPage.locators.taloustarkastettu).toBeVisible()
    await use({
      taloustarkastettu: true,
    })
  },
  valiAndLoppuselvitysSubmitted: async (
    { väliselvitysSubmitted, loppuselvitysSubmitted },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 60_000)
    expectToBeDefined(väliselvitysSubmitted)
    expectToBeDefined(loppuselvitysSubmitted)
    await use({})
  },
})
