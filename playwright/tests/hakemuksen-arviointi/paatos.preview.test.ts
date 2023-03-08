import { submittedHakemusTest } from '../../fixtures/muutoshakemusTest'
import { expect, Page } from '@playwright/test'
import { HakujenHallintaPage } from '../../pages/hakujenHallintaPage'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import { expectToBeDefined } from '../../utils/util'
import { BrowserContext } from 'playwright-chromium'

const lisatekstiDefault = 'myönteinenlisäteksti default'
const lisatekstiAmmatillinenKoulutus = 'myönteinenlisäteksti ammatillinen koulutus'

const test = submittedHakemusTest.extend({
  avustushakuID: async ({ page, userCache, hakuProps }, use, testInfo) => {
    expect(userCache).toBeDefined()
    testInfo.setTimeout(testInfo.timeout + 40_000)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createUnpublishedMuutoshakemusEnabledHaku(
      hakuProps
    )
    await test.step('add second koulutusaste', async () => {
      const { taTili } = hakujenHallintaPage.hauntiedotLocators()
      await taTili.tili(0).koulutusaste(0).addKoulutusasteBtn.click()
      await taTili.tili(0).koulutusaste(1).input.fill('Muut')
      await hakujenHallintaPage.page.keyboard.press('ArrowDown')
      await hakujenHallintaPage.page.keyboard.press('Enter')
    })
    const paatos = await hakujenHallintaPage.switchToPaatosTab()
    await test.step('add default lisäteksti', async () => {
      await paatos.locators.lisatekstiDefault.fill(lisatekstiDefault)
    })
    await test.step('add lisäteksti for only first koulutusaste', async () => {
      await paatos.locators.lisatekstiAmmatillinenKoulutus.fill(lisatekstiAmmatillinenKoulutus)
    })
    await test.step('publish avustushaku', async () => {
      await hakujenHallintaPage.switchToHaunTiedotTab()
      await hakujenHallintaPage.publishAvustushaku()
    })
    await use(avustushakuID)
  },
})

test('paatos lisäteksti', async ({ closedAvustushaku, context, avustushakuID, page, answers }) => {
  expectToBeDefined(closedAvustushaku)
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)
  const { taTili } = hakemustenArviointiPage.arviointiTabLocators()
  await test.step('if no talousarviotili selected show default text', async () => {
    await expect(taTili.value).toBeHidden()
    await openLuonnosAndExpectToContainText(page, context, lisatekstiDefault)
  })
  await test.step('if koulutusaste selected and have text for koulutusaste show it', async () => {
    await taTili.input.click()
    await taTili.option.nth(0).click()
    await expect(taTili.value).toContainText('Ammatillinen koulutus')
    await hakemustenArviointiPage.waitForSave()
    await openLuonnosAndExpectToContainText(page, context, lisatekstiAmmatillinenKoulutus)
  })
  await test.step('if koulutusaste selected with no own lisäteksti show default text', async () => {
    await taTili.input.click()
    await taTili.option.nth(1).click()
    await expect(taTili.value).toContainText('Muut')
    await hakemustenArviointiPage.waitForSave()
    await openLuonnosAndExpectToContainText(page, context, lisatekstiDefault)
  })
})

const openLuonnosAndExpectToContainText = async (
  page: Page,
  context: BrowserContext,
  text: string
) => {
  const [paatosPage] = await Promise.all([
    context.waitForEvent('page'),
    page.click('a:text-is("Luonnos")'),
  ])
  await expect(paatosPage.locator('section').nth(3)).toContainText(text)
  await paatosPage.close()
}
