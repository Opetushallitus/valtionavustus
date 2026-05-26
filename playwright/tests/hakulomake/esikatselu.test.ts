import { expect, Page } from '@playwright/test'
import { defaultValues as test } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { expectToBeDefined } from '../../utils/util'
import { getHakemusSubmitted, waitUntilMinEmails } from '../../utils/emails'
import { HAKIJA_URL, swedishAnswers } from '../../utils/constants'
import { Answers } from '../../utils/types'

async function expectReadOnly(page: Page) {
  await expect(page.locator('div.soresu-preview')).toBeVisible()
  await expect(page.locator('#topbar #form-controls button#submit')).toBeHidden()
  await expect(page.locator('input#bank-iban')).toHaveCount(0)
}

test('esikatselu path shows submitted hakemus in read-only mode', async ({
  page,
  hakuProps,
  answers,
  userCache,
}) => {
  expectToBeDefined(userCache)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
  const hakijaPage = HakijaAvustusHakuPage(page)

  await hakijaPage.navigate(avustushakuID, answers.lang)
  const { userKey } = await hakijaPage.fillAndSendMuutoshakemusEnabledHakemus(
    avustushakuID,
    answers
  )

  await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey)

  await test.step('form is shown in read-only preview mode', async () => {
    await expectReadOnly(page)
  })

  await test.step('submitted project name is visible', async () => {
    expectToBeDefined(answers.projectName)
    await expect(page.locator('#project-name')).toContainText(answers.projectName)
  })
})

test('esikatselu path stays read-only regardless of preview query param', async ({
  page,
  hakuProps,
  answers,
  userCache,
}) => {
  expectToBeDefined(userCache)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
  const hakijaPage = HakijaAvustusHakuPage(page)

  await hakijaPage.navigate(avustushakuID, answers.lang)
  const { userKey } = await hakijaPage.fillAndSendMuutoshakemusEnabledHakemus(
    avustushakuID,
    answers
  )

  await test.step('preview=true does not change read-only mode', async () => {
    await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'fi', { preview: 'true' })
    await expectReadOnly(page)
  })

  await test.step('preview=false does not enable edit mode', async () => {
    await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'fi', { preview: 'false' })
    await expectReadOnly(page)
  })
})

const swedishTest = test.extend<{ answers: Answers }>({
  answers: swedishAnswers,
})

test('hakemus-submitted email contains esikatselu URL', async ({
  page,
  hakuProps,
  answers,
  userCache,
}) => {
  expectToBeDefined(userCache)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
  const hakijaPage = HakijaAvustusHakuPage(page)

  await hakijaPage.navigate(avustushakuID, answers.lang)
  const { userKey } = await hakijaPage.fillAndSendMuutoshakemusEnabledHakemus(
    avustushakuID,
    answers
  )

  const hakemusID = await hakijaPage.getHakemusID(avustushakuID, userKey)
  const emails = await waitUntilMinEmails(getHakemusSubmitted, 1, hakemusID)

  expect(emails[0].formatted).toContain(
    `${HAKIJA_URL}/avustushaku/${avustushakuID}/esikatselu/${userKey}?lang=fi`
  )
})

swedishTest(
  'forhandsvisning path shows submitted hakemus in read-only mode',
  async ({ page, hakuProps, answers, userCache }) => {
    expectToBeDefined(userCache)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    const hakijaPage = HakijaAvustusHakuPage(page)

    await hakijaPage.navigate(avustushakuID, answers.lang)
    const { userKey } = await hakijaPage.fillAndSendMuutoshakemusEnabledHakemus(
      avustushakuID,
      answers
    )

    await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'sv')

    await swedishTest.step('form is shown in read-only preview mode', async () => {
      await expectReadOnly(page)
    })

    await swedishTest.step('submitted project name is visible', async () => {
      expectToBeDefined(answers.projectName)
      await expect(page.locator('#project-name')).toContainText(answers.projectName)
    })
  }
)

swedishTest(
  'forhandsvisning path stays read-only regardless of preview query param',
  async ({ page, hakuProps, answers, userCache }) => {
    expectToBeDefined(userCache)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    const hakijaPage = HakijaAvustusHakuPage(page)

    await hakijaPage.navigate(avustushakuID, answers.lang)
    const { userKey } = await hakijaPage.fillAndSendMuutoshakemusEnabledHakemus(
      avustushakuID,
      answers
    )

    await swedishTest.step('preview=true does not change read-only mode', async () => {
      await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'sv', { preview: 'true' })
      await expectReadOnly(page)
    })

    await swedishTest.step('preview=false does not enable edit mode', async () => {
      await hakijaPage.navigateToEsikatseluPage(avustushakuID, userKey, 'sv', { preview: 'false' })
      await expectReadOnly(page)
    })
  }
)

swedishTest(
  'hakemus-submitted email contains Swedish forhandsvisning URL',
  async ({ page, hakuProps, answers, userCache }) => {
    expectToBeDefined(userCache)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    const hakijaPage = HakijaAvustusHakuPage(page)

    await hakijaPage.navigate(avustushakuID, answers.lang)
    const { userKey } = await hakijaPage.fillAndSendMuutoshakemusEnabledHakemus(
      avustushakuID,
      answers
    )

    const hakemusID = await hakijaPage.getHakemusID(avustushakuID, userKey)
    const emails = await waitUntilMinEmails(getHakemusSubmitted, 1, hakemusID)

    expect(emails[0].formatted).toContain(
      `${HAKIJA_URL}/statsunderstod/${avustushakuID}/forhandsvisning/${userKey}?lang=sv`
    )
  }
)
