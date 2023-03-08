import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakijaMuutoshakemusPage'
import { MuutoshakemusValues } from '../../utils/types'
import moment from 'moment/moment'
import { navigate } from '../../utils/navigate'

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
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('rejected')
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.saveMuutoshakemus()
  })
  await test.step('shows correctly as rejected', async () => {
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus1, {
      status: 'rejected',
    })
  })
  await test.step('shows correctly as rejected in avustushaku', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(hakemustenArviointiPage.muutoshakemusStatusFieldContent()).toHaveText('Hylätty')
  })
  await test.step('when going again to muutoshakemus tab its still shown as rejected', async () => {
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus1, {
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
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('accepted')
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.saveMuutoshakemus()
  })
  await test.step('accepted muutoshakemus has correct values', async () => {
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus2, {
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
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.page.locator('[data-test-id=muutoshakemus-jatkoaika]').click()
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus2, {
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
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('rejected')
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.saveMuutoshakemus()
  })
  await test.step('submit muutoshakemus #4', async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus4)
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(true)
  })
  await test.step('in hakijaMuutoshakemusPage has correct values', async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    expect(await hakijaMuutoshakemusPage.existingMuutoshakemusLocator.allInnerTexts()).toHaveLength(
      4
    )
    const titles = await hakijaMuutoshakemusPage.existingMuutoshakemusLocator
      .locator('[data-test-id="existing-muutoshakemus-title"]')
      .allInnerTexts()
    expect(titles[0]).toContain('- Odottaa käsittelyä')
    expect(
      await hakijaMuutoshakemusPage.page.locator('[data-test-id="icon-rejected"]').elementHandles()
    ).toHaveLength(2)
  })
  await test.step('again displayed as uusi', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(hakemustenArviointiPage.muutoshakemusStatusFieldContent()).toHaveText('Uusi')
    await navigate(
      hakemustenArviointiPage.page,
      `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`
    )
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id=number-of-pending-muutoshakemukset]')
    ).toHaveText('(4)')
    await hakemustenArviointiPage.clickMuutoshakemusTab()
  })
  await test.step('muutoshakemus #4 has correct values', async () => {
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus4)
  })
  await test.step(
    'project end date is the same which was approved at muutoshakemus #2',
    async () => {
      await expect(
        hakemustenArviointiPage.page.locator('[data-test-id="project-end-date"]')
      ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    }
  )
  await test.step('navigate with tab and check muutoshakemus #3 values', async () => {
    await hakemustenArviointiPage.page.locator('[data-test-id="muutoshakemus-tab-1"]').click()
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus3, {
      status: 'rejected',
    })
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="project-end-date"]')
    ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    expect(await hakemustenArviointiPage.getPaatosPerustelut()).toEqual(
      'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.'
    )
  })
  await test.step('navigate with tab and check muutoshakemus #2 values', async () => {
    await hakemustenArviointiPage.page.locator('[data-test-id="muutoshakemus-tab-2"]').click()
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus2, {
      status: 'accepted',
    })
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="project-end-date"]')
    ).toHaveText('20.04.4200')
    expect(await hakemustenArviointiPage.getPaatosPerustelut()).toEqual(
      'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset hakemuksen mukaisesti.'
    )
  })
  await test.step('navigate with tab and check muutoshakemus #1 values', async () => {
    await hakemustenArviointiPage.page.locator('[data-test-id="muutoshakemus-tab-3"]').click()
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus1, {
      status: 'rejected',
    })
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="project-end-date"]')
    ).toHaveText('20.04.4200')
    await expect(
      hakemustenArviointiPage.page.locator('.answer-new-value #project-end div')
    ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    expect(await hakemustenArviointiPage.getPaatosPerustelut()).toEqual(
      'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.'
    )
  })
  await test.step('reject muutoshakemus #4', async () => {
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('rejected')
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.saveMuutoshakemus()
  })
  await test.step('submit muutoshakemus #5', async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus5)
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(true)
  })
  await test.step('accept muutoshakemus #5 with changes', async () => {
    const newAcceptedJatkoaika = '20.04.2400' as const
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision(
      'accepted_with_changes',
      newAcceptedJatkoaika
    )
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="current-project-end-date"]')
    ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    await expect(
      hakemustenArviointiPage.page.locator(
        '[data-test-id="approve-with-changes-muutoshakemus-jatkoaika"]'
      )
    ).toHaveText(muutoshakemus2.jatkoaika!.format('DD.MM.YYYY'))
    await hakemustenArviointiPage.saveMuutoshakemus()
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id=muutoshakemus-jatkoaika]')
    ).toHaveText(newAcceptedJatkoaika)
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="muutoshakemus-new-end-date-title"]')
    ).toHaveText('Hyväksytty uusi viimeinen käyttöpäivä')
    await expect(
      hakemustenArviointiPage.page.locator('[data-test-id="muutoshakemus-current-end-date-title"]')
    ).toHaveText('Vanha viimeinen käyttöpäivä')
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
