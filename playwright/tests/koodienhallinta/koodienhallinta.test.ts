import { test as baseTest, expect } from '@playwright/test'
import { KoodienhallintaPage } from '../../pages/virkailija/koodienHallintaPage'
import { switchUserIdentityTo, expectToBeDefined } from '../../utils/util'
import { navigate } from '../../utils/navigate'

const test = baseTest.extend<{
  koodienhallintaPage: ReturnType<typeof KoodienhallintaPage>
}>({
  koodienhallintaPage: async ({ page }, use) => {
    const koodienhallintaPage = KoodienhallintaPage(page)
    await koodienhallintaPage.navigate()
    await use(koodienhallintaPage)
  },
})

const colorDarkGray = 'rgb(153, 146, 144)'

test.describe('Koodienhallinta', () => {
  test.beforeEach(async ({ page }) => {
    await switchUserIdentityTo(page, 'valtionavustus')
  })

  test('koodienhallinta tab is hidden from non admin user', async ({ page }) => {
    await navigate(page, '/')
    const link = page.locator('a[href="/admin-ui/va-code-values/"]')
    await expect(link).toBeVisible()
    await switchUserIdentityTo(page, 'viivivirkailija')
    await expect(link).not.toBeVisible()
  })

  test('koodienhallinta tab can not be navigated to by non admin user', async ({ page }) => {
    const response = await navigate(page, '/admin-ui/va-code-values/')
    expectToBeDefined(response)
    expect(response.status()).toEqual(200)

    await navigate(page, '/')
    await switchUserIdentityTo(page, 'viivivirkailija')

    const responseForNonAdmin = await navigate(page, '/admin-ui/va-code-values/')
    expectToBeDefined(responseForNonAdmin)
    expect(responseForNonAdmin.status()).toEqual(401)
  })

  test('deleting code works', async ({ page, koodienhallintaPage }) => {
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.nameInput.fill('testName')
    await koodienhallintaPage.codeInput.fill('testCode')
    await koodienhallintaPage.submit()
    await koodienhallintaPage.codeList.locator('text=testCode').waitFor()
    page.on('dialog', (dialog) => dialog.accept('Oletko aivan varma, että haluat poistaa koodin?'))
    await koodienhallintaPage.page
      .locator('[data-test-id=code-cell-2022-testCode-testName]')
      .locator('[data-test-id=delete-code]')
      .click()
  })

  test('validates year input', async ({ koodienhallintaPage }) => {
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('1900')
    await koodienhallintaPage.nameInput.fill('testName')
    await koodienhallintaPage.codeInput.fill('testCode')
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.codeInputFormHasError('Vuosi voi olla minimissään 1970')
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('2200')
    await koodienhallintaPage.codeInputFormHasError('Vuosi voi olla maksimissaan 2100')
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('')
    await koodienhallintaPage.codeInputFormHasError('Vuosi on pakollinen')
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.submitButton.isEnabled()
    await koodienhallintaPage.noCodeInputFormErrors()
    await koodienhallintaPage.submit()
    await koodienhallintaPage.codeRowLocator('2022', 'testCode').waitFor()
  })
  test('validates code input', async ({ koodienhallintaPage }) => {
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.codeInput.fill('')
    await koodienhallintaPage.nameInput.fill('testName')
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.codeInputFormHasError('Koodi on pakollinen')
    await koodienhallintaPage.codeInput.fill('long test code is long')
    await koodienhallintaPage.submitButton.isEnabled()
    await koodienhallintaPage.noCodeInputFormErrors()
    await koodienhallintaPage.submit()
    await koodienhallintaPage.codeRowLocator('2022', 'long test code is long').waitFor()
  })
  test('validates name input', async ({ koodienhallintaPage }) => {
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.nameInput.fill('')
    await koodienhallintaPage.codeInput.fill('testCode')
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.codeInputFormHasError('Nimi on pakollinen')
    await koodienhallintaPage.nameInput.fill('testName')
    await koodienhallintaPage.submitButton.isEnabled()
    await koodienhallintaPage.noCodeInputFormErrors()
    await koodienhallintaPage.submit()
    await koodienhallintaPage.codeRowLocator('2022', 'testCode').waitFor()
  })
  test('navigating between tabs clears values in form', async ({ koodienhallintaPage }) => {
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.codeInput.fill('will be')
    await koodienhallintaPage.nameInput.fill('cleared')
    await koodienhallintaPage.submitButton.isEnabled()
    await koodienhallintaPage.clickKoodienhallintaTab('project')
    expect(await koodienhallintaPage.yearInput.textContent()).toEqual('')
    expect(await koodienhallintaPage.nameInput.textContent()).toEqual('')
    expect(await koodienhallintaPage.nameInput.textContent()).toEqual('')
    await koodienhallintaPage.submitButton.isDisabled()
  })

  test('When a code is created', async ({ koodienhallintaPage }) => {
    const codeValues = await koodienhallintaPage.createRandomCodeValues()
    const codeYear = '2020'
    const rowLocator = koodienhallintaPage.codeRowLocator(codeYear, codeValues.operationalUnit)

    await test.step('the code is visible in the page', async () => {
      await koodienhallintaPage.navigate()
      await expect(rowLocator).toBeVisible()
      await koodienhallintaPage.assertCodeIsVisible(codeYear, codeValues.operationalUnit)
    })

    await test.step('the code is visible in haku editor dropdown', async () => {
      const haunTiedotPage = await koodienhallintaPage.navigateToHakujenHallintaPage()
      await haunTiedotPage.selectVaCodes(codeValues)
      await haunTiedotPage.common.waitForSave()
    })

    await test.step('And virkailija hides the code', async () => {
      await koodienhallintaPage.navigate()
      await koodienhallintaPage.clickCodeVisibilityButton(
        codeYear,
        codeValues.operationalUnit,
        false
      )

      await test.step('the code is not visible', async () => {
        await expect(rowLocator).toBeVisible()
        await koodienhallintaPage.assertCodeIsHidden(codeYear, codeValues.operationalUnit)
      })

      await test.step('the code is displayed as gray', async () => {
        const hakujenHallintaPage = await koodienhallintaPage.navigateToHakujenHallintaPage()

        await test.step('in haku editor dropdown placeholder', async () => {
          const styles = await hakujenHallintaPage.getInputPlaceholderCodeStyles('operational-unit')
          expect(styles.color).toEqual(colorDarkGray)
        })

        await test.step('in haku editor dropdown options', async () => {
          await hakujenHallintaPage.fillCode('operational-unit', codeValues.operationalUnit)
          const styles = await hakujenHallintaPage.getInputOptionCodeStyles(
            codeValues.operationalUnit
          )
          expect(styles.color).toEqual(colorDarkGray)
        })
      })

      await test.step('the code is not visible after navigation', async () => {
        await koodienhallintaPage.navigate()
        await koodienhallintaPage.assertCodeIsHidden(codeYear, codeValues.operationalUnit)
      })

      await test.step('When virkailija makes the code visible again', async () => {
        await koodienhallintaPage.navigate()
        await koodienhallintaPage.clickCodeVisibilityButton(
          '2020',
          codeValues.operationalUnit,
          true
        )

        await test.step('the code is visible on koodien hallinta page', async () => {
          await koodienhallintaPage.assertCodeIsVisible(codeYear, codeValues.operationalUnit)
        })

        await test.step('the code is not displayed as gray', async () => {
          const haunTiedotPage = await koodienhallintaPage.navigateToHakujenHallintaPage()

          await test.step('in haku editor dropdown placeholder', async () => {
            const styles = await haunTiedotPage.getInputPlaceholderCodeStyles('operational-unit')
            expect(styles.color).not.toEqual(colorDarkGray)
          })

          await test.step('in haku editor dropdown options', async () => {
            await haunTiedotPage.fillCode('operational-unit', codeValues.operationalUnit)
            const styles = await haunTiedotPage.getInputOptionCodeStyles(codeValues.operationalUnit)
            expect(styles.color).not.toEqual(colorDarkGray)
          })
        })
      })
    })
  })
})
