import { expect, Page } from '@playwright/test'
import { defaultValues as test } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { expectToBeDefined, waitForNewTab } from '../../utils/util'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { getHakemusSubmitted, waitUntilMinEmails } from '../../utils/emails'
import { HAKIJA_URL, swedishAnswers } from '../../utils/constants'
import { Answers } from '../../utils/types'

async function expectReadOnly(page: Page) {
  await expect(page.locator('div.soresu-preview')).toBeVisible()
  await expect(page.locator('#topbar #form-controls button#submit')).toBeHidden()
  await expect(page.locator('input#bank-iban')).toHaveCount(0)
}

const swedishTest = test.extend<{ answers: Answers }>({
  answers: swedishAnswers,
})

test('esikatselu shows submitted hakemus read-only and is linked from email and virkailija', async ({
  page,
  hakuProps,
  answers,
  userCache,
}) => {
  expectToBeDefined(userCache)
  expectToBeDefined(answers.projectName)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
  const hakijaPage = HakijaAvustusHakuPage(page)

  await hakijaPage.navigate(avustushakuID, answers.lang)
  const { userKey } = await hakijaPage.fillAndSendMuutoshakemusEnabledHakemus(
    avustushakuID,
    answers
  )
  const hakemusID = await hakijaPage.getHakemusID(avustushakuID, userKey)

  await test.step('esikatselu path shows submitted hakemus in read-only mode', async () => {
    await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey)
    await expectReadOnly(page)
    await expect(page.locator('#project-name')).toContainText(answers.projectName!)
  })

  await test.step('esikatselu path stays read-only regardless of preview query param', async () => {
    await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'fi', { preview: 'true' })
    await expectReadOnly(page)
    await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'fi', { preview: 'false' })
    await expectReadOnly(page)
  })

  await test.step('hakemus-submitted email contains esikatselu URL', async () => {
    const emails = await waitUntilMinEmails(getHakemusSubmitted, 1, hakemusID)
    expect(emails[0].formatted).toContain(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/esikatselu/${userKey}?lang=fi`
    )
  })

  await test.step('Esikatselu button in virkailija opens esikatselu path in new tab', async () => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToHakemusArviointi(avustushakuID, hakemusID)

    const [newTab] = await Promise.all([
      waitForNewTab(page),
      page.getByTestId('hakemus-esikatselu-link').click(),
    ])
    await newTab.waitForLoadState()

    expect(newTab.url()).toContain(`/avustushaku/${avustushakuID}/esikatselu/${userKey}`)
    await expectReadOnly(newTab)
    await expect(newTab.locator('#project-name')).toContainText(answers.projectName!)
  })
})

swedishTest(
  'forhandsvisning shows submitted hakemus read-only and is linked from email',
  async ({ page, hakuProps, answers, userCache }) => {
    expectToBeDefined(userCache)
    expectToBeDefined(answers.projectName)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    const hakijaPage = HakijaAvustusHakuPage(page)

    await hakijaPage.navigate(avustushakuID, answers.lang)
    const { userKey } = await hakijaPage.fillAndSendMuutoshakemusEnabledHakemus(
      avustushakuID,
      answers
    )

    await swedishTest.step(
      'forhandsvisning path shows submitted hakemus in read-only mode',
      async () => {
        await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'sv')
        await expectReadOnly(page)
        await expect(page.locator('#project-name')).toContainText(answers.projectName!)
      }
    )

    await swedishTest.step(
      'forhandsvisning path stays read-only regardless of preview query param',
      async () => {
        await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'sv', { preview: 'true' })
        await expectReadOnly(page)
        await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'sv', {
          preview: 'false',
        })
        await expectReadOnly(page)
      }
    )

    await swedishTest.step(
      'hakemus-submitted email contains Swedish forhandsvisning URL',
      async () => {
        const hakemusID = await hakijaPage.getHakemusID(avustushakuID, userKey)
        const emails = await waitUntilMinEmails(getHakemusSubmitted, 1, hakemusID)
        expect(emails[0].formatted).toContain(
          `${HAKIJA_URL}/statsunderstod/${avustushakuID}/forhandsvisning/${userKey}?lang=sv`
        )
      }
    )
  }
)
