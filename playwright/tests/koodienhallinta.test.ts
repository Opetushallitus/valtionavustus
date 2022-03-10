import {test as baseTest, expect} from "@playwright/test"
import {KoodienhallintaPage} from "../pages/koodienHallintaPage";
import {
  switchUserIdentityTo,
  expectToBeDefined
} from "../utils/util"
import {
  navigate
} from "../utils/navigate"

const test = baseTest.extend<{koodienhallintaPage: KoodienhallintaPage}>({
  koodienhallintaPage: async ({page}, use) => {
    const koodienhallintaPage = new KoodienhallintaPage(page)
    await koodienhallintaPage.navigate()
    await use(koodienhallintaPage)
  }
})

test.describe('Koodienhallinta', () => {
  test.beforeEach(async ({page}) => {
    await switchUserIdentityTo(page, 'valtionavustus')
  })

  test('koodienhallinta tab is hidden from non admin user', async ({page}) => {
    await navigate(page, '/')
    await page.waitForSelector('#va-code-values')
    await switchUserIdentityTo(page, 'viivivirkailija')
    await page.waitForSelector('#va-code-values', {state: 'hidden'})
  })

  test('koodienhallinta tab can not be navigated to by non admin user', async ({page}) => {
    const response = await navigate(page, '/admin-ui/va-code-values/')
    expectToBeDefined(response)
    expect(response.status()).toEqual(200)

    await navigate(page, '/')
    await switchUserIdentityTo(page, 'viivivirkailija')

    const responseForNonAdmin = await navigate(page, '/admin-ui/va-code-values/')
    expectToBeDefined(responseForNonAdmin)
    expect(responseForNonAdmin.status()).toEqual(401)
  })

  test('deleting code works', async ({page, koodienhallintaPage}) => {
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.nameInput.fill( 'testName')
    await koodienhallintaPage.codeInput.fill('testCode')
    await koodienhallintaPage.submitButton.click()
    await koodienhallintaPage.codeList.locator('text=testCode')
    page.on('dialog', dialog => dialog.accept('Oletko aivan varma, että haluat poistaa koodin?'))
    await koodienhallintaPage.page.locator('[data-test-id=code-cell-2022-testCode-testName]').locator('[data-test-id=delete-code]').click()
  })

  test('validates year input', async ({koodienhallintaPage}) => {
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('1900')
    await koodienhallintaPage.nameInput.fill( 'testName')
    await koodienhallintaPage.codeInput.fill('testCode')
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.codeInputFormHasError("Vuosi voi olla minimissään 1970")
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('2200')
    await koodienhallintaPage.codeInputFormHasError("Vuosi voi olla maksimissaan 2100")
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('')
    await koodienhallintaPage.codeInputFormHasError("Vuosi on pakollinen")
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.submitButton.isEnabled()
    await koodienhallintaPage.noCodeInputFormErrors()
  })
  test('validates code input', async ({koodienhallintaPage}) => {
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.codeInput.fill('this input is too long')
    await koodienhallintaPage.nameInput.fill( 'testName')
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.codeInputFormHasError("Koodi voi olla max 13 merkkiä pitkä")
    await koodienhallintaPage.codeInput.fill('')
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.codeInputFormHasError("Koodi on pakollinen")
    await koodienhallintaPage.codeInput.fill('testCode')
    await koodienhallintaPage.submitButton.isEnabled()
    await koodienhallintaPage.noCodeInputFormErrors()
  })
  test('validates name input', async ({koodienhallintaPage}) => {
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.nameInput.fill( '')
    await koodienhallintaPage.codeInput.fill('testCode')
    await koodienhallintaPage.submitButton.isDisabled()
    await koodienhallintaPage.codeInputFormHasError("Nimi on pakollinen")
    await koodienhallintaPage.nameInput.fill('testName')
    await koodienhallintaPage.submitButton.isEnabled()
    await koodienhallintaPage.noCodeInputFormErrors()
  })
  test('navigating between tabs clears values in form', async ({koodienhallintaPage}) => {
    await koodienhallintaPage.yearInput.fill('2022')
    await koodienhallintaPage.codeInput.fill('will be')
    await koodienhallintaPage.nameInput.fill( 'cleared')
    await koodienhallintaPage.submitButton.isEnabled()
    await koodienhallintaPage.clickKoodienhallintaTab("project")
    expect(await koodienhallintaPage.yearInput.textContent()).toEqual('')
    expect(await koodienhallintaPage.nameInput.textContent()).toEqual('')
    expect(await koodienhallintaPage.nameInput.textContent()).toEqual('')
    await koodienhallintaPage.submitButton.isDisabled()
  })
})
