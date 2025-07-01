import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { MuutoshakemusValues } from '../../utils/types'
import moment from 'moment/moment'
import { navigate } from '../../utils/navigate'
import { createMuutoshakemusTab } from '../../pages/virkailija/hakemusten-arviointi/MuutoshakemusTab'

const muutoshakemus1: MuutoshakemusValues = {
  jatkoaika: moment(new Date()).add(2, 'months').add(1, 'days').locale('fi'),
  jatkoaikaPerustelu: 'Ei meinaa ehtii',
}

const muutoshakemus2: MuutoshakemusValues = {
  jatkoaika: moment(new Date()).add(3, 'months').add(1, 'days').locale('fi'),
  jatkoaikaPerustelu: 'Ei kerkee vieläkään',
}

const muutoshakemus3: MuutoshakemusValues = {
  jatkoaika: moment(new Date()).add(1, 'months').add(1, 'days').locale('fi'),
  jatkoaikaPerustelu: 'Apua en kerkee',
}

const muutoshakemus4: MuutoshakemusValues = {
  jatkoaika: moment(new Date()).add(4, 'months').add(1, 'days').locale('fi'),
  jatkoaikaPerustelu: 'EN KERKEE',
}

const muutoshakemus5: MuutoshakemusValues = {
  jatkoaika: muutoshakemus2.jatkoaika,
  jatkoaikaPerustelu: 'APUA',
}

test('multiple muutoshakemus', async ({ page, acceptedHakemus: { hakemusID }, avustushakuID }) => {
  await test.step('send muutoshakemus #1', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus1)
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
  })

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await test.step('reject muutoshakemus #1', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await muutoshakemusTab.setMuutoshakemusJatkoaikaDecision('rejected')
    await muutoshakemusTab.selectVakioperusteluInFinnish()
    await muutoshakemusTab.saveMuutoshakemus()

    await muutoshakemusTab.validateMuutoshakemusValues(muutoshakemus1, {
      status: 'rejected',
    })
  })
  await test.step('shows correctly as rejected in avustushaku', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(hakemustenArviointiPage.muutoshakemusStatusFieldContent()).toHaveText('Hylätty')
  })
  await test.step('when going again to muutoshakemus tab its still shown as rejected', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await muutoshakemusTab.validateMuutoshakemusValues(muutoshakemus1, {
      status: 'rejected',
    })
  })
  const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
  await test.step('submit muutoshakemus #2', async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus2)
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(true)
  })

  await test.step('accept muutoshakemus #2', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await muutoshakemusTab.setMuutoshakemusJatkoaikaDecision('accepted')
    await muutoshakemusTab.selectVakioperusteluInFinnish()
    await muutoshakemusTab.saveMuutoshakemus()

    await muutoshakemusTab.validateMuutoshakemusValues(muutoshakemus2, {
      status: 'accepted',
    })
    await expect(
      hakemustenArviointiPage.page.locator('.answer-old-value #project-end div')
    ).toHaveText('20.04.4200')
    await expect(
      hakemustenArviointiPage.page.locator('.answer-new-value #project-end div')
    ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
  })
  await test.step('muutoshakemus status is hyväksytty in hakemustenArviointiPage ', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(hakemustenArviointiPage.muutoshakemusStatusFieldContent()).toHaveText('Hyväksytty')
  })
  await test.step('in jatkoaika tab shos correct values', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await muutoshakemusTab.locators.jatkoaika.click()
    await muutoshakemusTab.validateMuutoshakemusValues(muutoshakemus2, {
      status: 'accepted',
    })
  })
  await test.step('submit muutoshakemus #3', async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus3)
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(true)
  })
  await test.step('reject muutoshakemus #3', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await muutoshakemusTab.setMuutoshakemusJatkoaikaDecision('rejected')
    await muutoshakemusTab.selectVakioperusteluInFinnish()
    await muutoshakemusTab.saveMuutoshakemus()
  })
  await test.step('submit muutoshakemus #4', async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus4)
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(true)
  })

  await test.step('in hakijaMuutoshakemusPage has correct values', async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await expect(hakijaMuutoshakemusPage.existingMuutoshakemusLocator).toHaveCount(4)
    await expect(hakijaMuutoshakemusPage.existingMuutoshakemusLocator.first()).toContainText(
      '- Odottaa käsittelyä'
    )
    await expect(hakijaMuutoshakemusPage.page.getByTestId('icon-rejected')).toHaveCount(2)
  })

  await test.step('check muutoshakemus #4', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)

    await test.step('again displayed as uusi', async () => {
      await expect(hakemustenArviointiPage.muutoshakemusStatusFieldContent()).toHaveText('Uusi')
      await navigate(
        hakemustenArviointiPage.page,
        `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`
      )
      await expect(
        hakemustenArviointiPage.page.locator('[data-test-id=number-of-pending-muutoshakemukset]')
      ).toHaveText('(4)')
    })

    const muutoshakemusTab = await hakemustenArviointiPage.clickMuutoshakemusTab()

    await test.step('muutoshakemus #4 has correct values', async () => {
      await muutoshakemusTab.validateMuutoshakemusValues(muutoshakemus4)
    })

    await test.step('project end date is the same which was approved at muutoshakemus #2', async () => {
      await expect(
        hakemustenArviointiPage.page.locator('[data-test-id="project-end-date"]')
      ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    })
  })

  await test.step('navigate with tab and check muutoshakemus #3 values', async () => {
    const muutoshakemusTab = createMuutoshakemusTab(page)

    await muutoshakemusTab.locators.multipleMuutoshakemus.tabN(1).click()
    await muutoshakemusTab.validateMuutoshakemusValues(muutoshakemus3, {
      status: 'rejected',
    })
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="project-end-date"]')
    ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    await expect(muutoshakemusTab.locators.paatosPerustelut).toHaveText(
      'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.'
    )
  })
  await test.step('navigate with tab and check muutoshakemus #2 values', async () => {
    const muutoshakemusTab = createMuutoshakemusTab(page)

    await muutoshakemusTab.locators.multipleMuutoshakemus.tabN(2).click()
    await muutoshakemusTab.validateMuutoshakemusValues(muutoshakemus2, {
      status: 'accepted',
    })
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="project-end-date"]')
    ).toHaveText('20.04.4200')
    await expect(muutoshakemusTab.locators.paatosPerustelut).toHaveText(
      'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset hakemuksen mukaisesti.'
    )
  })
  await test.step('navigate with tab and check muutoshakemus #1 values', async () => {
    const muutoshakemusTab = createMuutoshakemusTab(page)

    await muutoshakemusTab.locators.multipleMuutoshakemus.tabN(3).click()
    await muutoshakemusTab.validateMuutoshakemusValues(muutoshakemus1, {
      status: 'rejected',
    })
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="project-end-date"]')
    ).toHaveText('20.04.4200')
    await expect(
      hakemustenArviointiPage.page.locator('.answer-new-value #project-end div')
    ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    await expect(muutoshakemusTab.locators.paatosPerustelut).toHaveText(
      'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.'
    )
  })
  await test.step('reject muutoshakemus #4', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await muutoshakemusTab.setMuutoshakemusJatkoaikaDecision('rejected')
    await muutoshakemusTab.selectVakioperusteluInFinnish()
    await muutoshakemusTab.saveMuutoshakemus()
  })
  await test.step('submit muutoshakemus #5', async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus5)
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(true)
  })
  await test.step('accept muutoshakemus #5 with changes', async () => {
    const newAcceptedJatkoaika = '20.04.2400' as const
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await muutoshakemusTab.setMuutoshakemusJatkoaikaDecision(
      'accepted_with_changes',
      newAcceptedJatkoaika
    )
    await muutoshakemusTab.selectVakioperusteluInFinnish()
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="current-project-end-date"]')
    ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    await expect(
      hakemustenArviointiPage.page.locator(
        '[data-test-id="approve-with-changes-muutoshakemus-jatkoaika"]'
      )
    ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    await muutoshakemusTab.saveMuutoshakemus()
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id=muutoshakemus-jatkoaika]')
    ).toHaveText(newAcceptedJatkoaika)
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="muutoshakemus-new-end-date-title"]')
    ).toHaveText('Muutoshakemuksella haettu uusi viimeinen käyttöpäivä')
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="muutoshakemus-current-end-date-title"]')
    ).toHaveText('Avustuksen viimeinen käyttöpäivä')
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="muutoshakemus-reasoning-title"]')
    ).toHaveText('Hakijan perustelut')
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="paatos-jatkoaika"]')
    ).toHaveText('Hyväksytään haetut muutokset käyttöaikaan muutettuna')
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="muutoshakemus-jatkoaika"]')
    ).toHaveText(newAcceptedJatkoaika)
  })
})
