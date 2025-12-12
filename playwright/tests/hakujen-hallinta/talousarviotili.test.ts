import path from 'node:path'
import fs from 'node:fs/promises'

import { expect, Locator, Page } from '@playwright/test'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { KoodienhallintaPage } from '../../pages/virkailija/koodienHallintaPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { createRandomTalousarviotiliCode, randomString } from '../../utils/random'
import { expectToBeDefined } from '../../utils/util'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { addMigratedTalousarviotili } from '../../utils/avustushaku'
import { HaunTiedotPage } from '../../pages/virkailija/hakujen-hallinta/HaunTiedotPage'

type CreateTaTili = {
  code: string
  name: string
  year: number
  amount: number
}

const taTiliSelectValue = ({ code, name, year }: CreateTaTili) => `${code} ${name} (${year})`

const koulutus = 'Ammatillinen koulutus'
const lukio = 'Lukiokoulutus'
const kansalaisopisto = 'Kansalaisopisto'

const createTaTilit = async (page: Page) => {
  const tatili1 = {
    code: createRandomTalousarviotiliCode(),
    name: `Tili 1 ${randomString()}`,
    year: 2022,
    amount: 10000,
  }
  const tatili2 = {
    code: createRandomTalousarviotiliCode(),
    name: `Tili 2 ${randomString()}`,
    year: 2022,
    amount: 10000,
  }
  await test.step('create test tatilit', async () => {
    const koodienhallintaPage = KoodienhallintaPage(page)
    await koodienhallintaPage.navigate()
    await koodienhallintaPage.switchToTatilitTab()
    const taForm = koodienhallintaPage.taTilit.form
    const createTaTili = async ({ code, name, year, amount }: typeof tatili1) => {
      await taForm.code.input.fill(code)
      await taForm.name.input.fill(name)
      await taForm.year.input.fill(String(year))
      await taForm.amount.input.fill(String(amount))
      await taForm.submitBtn.click()
      await expect(taForm.submitBtn).toBeEnabled()
    }
    await createTaTili(tatili1)
    await createTaTili(tatili2)
  })
  return {
    tatili1,
    tatili2,
  }
}

const test = defaultValues.extend<{
  tilit: {
    tatili1: CreateTaTili
    tatili2: CreateTaTili
  }
}>({
  tilit: async ({ page, hakuProps, avustushakuName }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)
    const tilit = await createTaTilit(page)
    const hakujenHallinta = new HakujenHallintaPage(page)

    const esimerkkiHakuWithContactDetails = await fs.readFile(
      path.join(__dirname, '../../fixtures/avustushaku-with-contact-details.json'),
      'utf8'
    )

    await hakujenHallinta.createHakuWithLomakeJson(esimerkkiHakuWithContactDetails, hakuProps)
    await hakujenHallinta.commonHakujenHallinta.switchToHaunTiedotTab()

    const haunTiedotPage = HaunTiedotPage(page)
    await haunTiedotPage.locators.hakuName.fi.fill(avustushakuName)
    await use(tilit)
  },
})

test.describe.parallel('talousarvio select', () => {
  test('migrated talousarviotili cannot be selected for new avustushaku', async ({ page }) => {
    const migratedTili = createRandomTalousarviotiliCode()
    await addMigratedTalousarviotili(page, migratedTili)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.copyEsimerkkihaku()
    const haunTiedotPage = HaunTiedotPage(page)
    const locators = haunTiedotPage.locators
    const firstTili = locators.taTili.tili(0)
    await expect(firstTili.value).toBeHidden()
    await firstTili.input.fill(migratedTili)
    await expect(firstTili.option).toHaveCount(1)
    const firstOption = await firstTili.option.first()
    await test.step('talousarviotili is found in list', async () => {
      await expect(firstOption).toHaveText(migratedTili)
    })
    await test.step('talousarviotili is disabled', async () => {
      await expect(firstOption).toHaveAttribute('aria-disabled', 'true')
    })
  })
  test('tili and koulutusaste basic flow', async ({ page, tilit: { tatili1 } }) => {
    const haunTiedotPage = HaunTiedotPage(page)
    const taTili = haunTiedotPage.locators.taTili
    const firstTili = taTili.tili(0)
    const firstTiliFirstKoulutusaste = firstTili.koulutusaste(0)

    await test.step('Remove existing talousarviotili to start on a clean slate', async () => {
      await page.getByTitle('Poista talousarviotili').click()
    })

    await test.step('correct starting states', async () => {
      await expect(firstTili.placeholder).toHaveText('Valitse talousarviotili')
      await expect(firstTiliFirstKoulutusaste.placeholder).toHaveText(
        'Valitse ensin talousarviotili'
      )
      await expect(firstTiliFirstKoulutusaste.input).toBeDisabled()
    })
    await test.step('can select tili', async () => {
      await expect(firstTili.value).toBeHidden()
      await firstTili.input.fill(tatili1.name)
      await expect(firstTili.option.first()).toBeEnabled()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await haunTiedotPage.common.waitForSave()
      await expect(firstTili.placeholder).toBeHidden()
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili1))
    })
    await test.step('tili is disabled in options after its selected', async () => {
      await firstTili.input.click()
      await firstTili.input.fill(tatili1.name)
      await expect(firstTili.option.first()).toBeVisible()
      await expect(firstTili.option.first()).toHaveAttribute('aria-disabled', 'true')
    })
    await test.step('koulutusaste select gets enabled after selecting tili', async () => {
      await expect(firstTiliFirstKoulutusaste.input).toBeEnabled()
      await expect(firstTiliFirstKoulutusaste.placeholder).toHaveText(
        'Valitse talousarviotilin koulutusaste'
      )
    })
    await test.step('can add koulutusaste', async () => {
      await expect(firstTiliFirstKoulutusaste.addKoulutusasteBtn).toBeHidden()
      await expect(firstTiliFirstKoulutusaste.value).toBeHidden()
      await firstTiliFirstKoulutusaste.input.fill(koulutus)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await expect(firstTiliFirstKoulutusaste.placeholder).toBeHidden()
      await expect(firstTiliFirstKoulutusaste.value).toHaveText(koulutus)
      await haunTiedotPage.common.waitForSave()
      await expect(firstTiliFirstKoulutusaste.addKoulutusasteBtn).toBeVisible()
    })
    await test.step('values where saved', async () => {
      await page.reload()
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili1))
      await expect(firstTiliFirstKoulutusaste.value).toHaveText(koulutus)
    })
    await test.step('input is disabled when saving avustushaku', async () => {
      await expect(firstTili.input).toBeEnabled()
      await expect(firstTiliFirstKoulutusaste.input).toBeEnabled()
      await Promise.all([
        expect(firstTili.input).toBeDisabled(),
        expect(firstTiliFirstKoulutusaste.input).toBeDisabled(),
        haunTiedotPage.locators.hakuName.fi.pressSequentially('trigger auto save'),
      ])
      await expect(firstTili.input).toBeEnabled()
      await expect(firstTiliFirstKoulutusaste.input).toBeEnabled()
    })
  })
  test('empty selects dont get saved', async ({ tilit: { tatili1 }, page }) => {
    const haunTiedotPage = HaunTiedotPage(page)

    await test.step('Remove existing talousarviotili to start on a clean slate', async () => {
      await page.getByTitle('Poista talousarviotili').click()
    })
    const locators = haunTiedotPage.locators
    const taTili = locators.taTili
    const firstTili = taTili.tili(0)
    const secondTili = taTili.tili(1)
    const thirdTili = taTili.tili(2)
    await test.step('add 2 more tilis', async () => {
      await firstTili.addTiliBtn.click()
      await expect(secondTili.input).toBeVisible()
      await firstTili.addTiliBtn.click()
      await expect(thirdTili.input).toBeVisible()
      await haunTiedotPage.common.waitForSave()
    })
    await test.step('add value to 3rd tili', async () => {
      await thirdTili.input.fill(tatili1.name)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await haunTiedotPage.common.waitForSave()
      await expect(thirdTili.value).toHaveText(taTiliSelectValue(tatili1))
    })
    await test.step('add koulutusaste to 3rd tili', async () => {
      await thirdTili.koulutusaste(0).input.fill(lukio)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await haunTiedotPage.common.waitForSave()
    })
    await test.step('add 3 more koulutusaste to third tili', async () => {
      await thirdTili.koulutusaste(0).addKoulutusasteBtn.click()
      await expect(thirdTili.koulutusaste(1).input).toBeVisible()
      await thirdTili.koulutusaste(0).addKoulutusasteBtn.first().click()
      await expect(thirdTili.koulutusaste(2).input).toBeVisible()
      await thirdTili.koulutusaste(0).addKoulutusasteBtn.first().click()
      await expect(thirdTili.koulutusaste(3).input).toBeVisible()
      await haunTiedotPage.common.waitForSave()
    })
    await test.step('add koulutusaste to 4th koulutusaste on 3rd tili', async () => {
      await thirdTili.koulutusaste(3).input.fill(kansalaisopisto)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await haunTiedotPage.common.waitForSave()
    })
    await test.step('after page reload empty selects disappear (as they are not saved)', async () => {
      await page.reload()
      await expect(firstTili.input).toBeVisible()
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili1))
      await expect(secondTili.input).toBeHidden()
      await expect(firstTili.koulutusaste(0).input).toBeVisible()
      await expect(firstTili.koulutusaste(0).value).toHaveText(lukio)
      await expect(firstTili.koulutusaste(1).input).toBeVisible()
      await expect(firstTili.koulutusaste(1).value).toHaveText(kansalaisopisto)
      await expect(firstTili.koulutusaste(2).input).toBeHidden()
    })
  })
  test('can delete tilis and koulutusaste', async ({ tilit: { tatili1, tatili2 }, page }) => {
    const haunTiedotPage = HaunTiedotPage(page)
    const locators = haunTiedotPage.locators
    const taTili = locators.taTili
    const firstTili = taTili.tili(0)
    const secondTili = taTili.tili(1)
    const thirdTili = taTili.tili(2)
    const secondTiliFirstKoulutusaste = secondTili.koulutusaste(0)
    const thirdTiliFirstKoulutusaste = thirdTili.koulutusaste(0)
    const thirdTiliSecondKoulutusaste = thirdTili.koulutusaste(1)
    const thirdTiliThirdKoulutusaste = thirdTili.koulutusaste(2)
    await test.step('add 2 more tilis', async () => {
      await firstTili.addTiliBtn.click()
      await expect(secondTili.input).toBeVisible()
      await firstTili.addTiliBtn.click()
      await expect(thirdTili.input).toBeVisible()
      await haunTiedotPage.common.waitForSave()
    })
    await test.step('add value to 2nd tili with koulutusaste', async () => {
      await secondTili.input.fill(tatili1.name)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await haunTiedotPage.common.waitForSave()
      await expect(secondTili.value).toHaveText(taTiliSelectValue(tatili1))
      await secondTiliFirstKoulutusaste.input.fill(lukio)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
    })
    await test.step('add value to 3rd tili', async () => {
      await thirdTili.input.fill(tatili2.name)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await haunTiedotPage.common.waitForSave()
      await expect(thirdTili.value).toHaveText(taTiliSelectValue(tatili2))
    })
    await test.step('add 3 koulutusaste to 3rd tili', async () => {
      await thirdTiliFirstKoulutusaste.input.fill(koulutus)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await thirdTiliFirstKoulutusaste.addKoulutusasteBtn.click()
      await thirdTiliSecondKoulutusaste.input.fill(lukio)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await thirdTiliSecondKoulutusaste.addKoulutusasteBtn.last().click()
      await thirdTiliThirdKoulutusaste.input.fill(kansalaisopisto)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await haunTiedotPage.common.waitForSave()
    })
    await test.step('remove 2nd koulutusaste from 3rd tili', async () => {
      await thirdTili.koulutusaste(1).removeKoulutusasteBtn(lukio).click()
      await haunTiedotPage.common.waitForSave()
      await expect(thirdTiliFirstKoulutusaste.value).toHaveText(koulutus)
      await expect(thirdTiliSecondKoulutusaste.value).toHaveText(kansalaisopisto)
      await expect(thirdTiliThirdKoulutusaste.value).toBeHidden()
    })
    await test.step('remove 1st and 2nd tili', async () => {
      await firstTili.removeTiliBtn.click()
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili1))
      await expect(secondTili.value).toHaveText(taTiliSelectValue(tatili2))
      await expect(thirdTili.input).toBeHidden()
      await firstTili.removeTiliBtn.click()
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili2))
      await expect(secondTili.input).toBeHidden()
      await haunTiedotPage.common.waitForSave()
    })
    await test.step('reload to see they saved correctly', async () => {
      await page.reload()
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili2))
      await expect(firstTili.koulutusaste(0).value).toHaveText(koulutus)
      await expect(firstTili.koulutusaste(1).value).toHaveText(kansalaisopisto)
      await expect(firstTili.koulutusaste(2).value).toBeHidden()
      await expect(secondTili.input).toBeHidden()
    })
  })
  test('cannot modify TA-tili or koulutusaste after haku has been published', async ({
    tilit,
    hakuProps,
    userCache,
    page,
  }) => {
    expectToBeDefined(userCache)
    expectToBeDefined(tilit)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    /*
      reload needed as hakuProps
      spawns a new browser context to create tilit
      and the test continues in the first browser
     */
    await hakujenHallintaPage.page.reload()
    await hakujenHallintaPage.fillAvustushaku(hakuProps)
    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    const taTili = haunTiedotPage.locators.taTili
    const firstTili = taTili.tili(0)
    const { addTiliBtn, removeTiliBtn, input } = firstTili
    const { addKoulutusasteBtn, removeKoulutusasteBtn: removeKoulutusasteBtnFn } =
      firstTili.koulutusaste(0)
    const removeKoulutusasteBtn = removeKoulutusasteBtnFn('Ammatillinen koulutus')
    const locators = [addTiliBtn, removeTiliBtn, addKoulutusasteBtn, removeKoulutusasteBtn, input]
    await verifyLocatorsAreEnabled(...locators)
    await haunTiedotPage.publishAvustushaku()
    await verifyLocatorsAreDisabled(...locators)
    await haunTiedotPage.setAvustushakuInDraftState()
    await verifyLocatorsAreEnabled(...locators)
    await haunTiedotPage.locators.status.published.click()
    await haunTiedotPage.resolveAvustushaku()
    await verifyLocatorsAreDisabled(...locators)
  })
})

muutoshakemusTest(
  'does not preselect talousarviotili if there are multiple to choose from',
  async ({ userCache, finalAvustushakuEndDate, page, answers, hakuProps }, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)
    expectToBeDefined(userCache)
    const { tatili1, tatili2 } = await createTaTilit(page)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID =
      await hakujenHallintaPage.createUnpublishedMuutoshakemusEnabledHaku(hakuProps)
    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await test.step('add 2 tilis to avustushaku', async () => {
      for (const { index, tili } of [
        { index: 0, tili: tatili2 },
        { index: 1, tili: tatili1 },
      ]) {
        const select = haunTiedotPage.locators.taTili.tili(index)
        await select.input.click()
        await select.input.fill(tili.name)
        await hakujenHallintaPage.page.keyboard.press('Tab')
        await hakujenHallintaPage.page.keyboard.press('Enter')
        await select.koulutusaste(0).input.fill(koulutus)
        await hakujenHallintaPage.page.keyboard.press('Tab')
        await hakujenHallintaPage.page.keyboard.press('Enter')
        await select.addTiliBtn.click()
      }
    })
    await haunTiedotPage.publishAvustushaku()
    await haunTiedotPage.common.waitForSave()
    await test.step('fill haku', async () => {
      const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
      await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(avustushakuID, answers)
    })
    await test.step('close avustushaku', async () => {
      const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
      await haunTiedotPage.setEndDate(finalAvustushakuEndDate.format('D.M.YYYY H.mm'))
    })
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    const { taTili } = await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)
    await test.step('in arviointi tatili is not preselected', async () => {
      await hakemustenArviointiPage.waitForSave()
      await expect(taTili.placeholder).toHaveText('Valitse talousarviotili')
    })
    await test.step('can select from multiple options', async () => {
      await taTili.input.click()
      await expect(taTili.option).toHaveCount(2)
      await expect(taTili.option.nth(0)).toContainText(tatili1.code)
      await expect(taTili.option.nth(1)).toContainText(tatili2.code)
      await taTili.option.nth(1).click()
      await hakemustenArviointiPage.waitForSave()
      await expect(taTili.value).toContainText(tatili2.code)
    })
  }
)

async function verifyLocatorsAreEnabled(...locators: Locator[]) {
  for (const locator of locators) {
    await expect(locator).toBeEnabled()
  }
}

async function verifyLocatorsAreDisabled(...locators: Locator[]) {
  for (const locator of locators) {
    await expect(locator).toBeDisabled()
  }
}
