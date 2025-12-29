import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { expect } from '@playwright/test'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { twoAcceptedHakemusTest as test } from '../../fixtures/twoHakemusTest'
import { expectToBeDefined } from '../../utils/util'

test('selects automatically only talousarviotili and projektikoodi', async ({
  page,
  submittedHakemus,
  avustushakuID,
  answers,
  secondAnswers,
  projektikoodi,
  talousarviotili,
}) => {
  expectToBeDefined(submittedHakemus)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
  await haunTiedotPage.closeAvustushakuByChangingEndDateToPast()
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  await expect(hakemustenArviointiPage.hakemusListing).toContainText('2/2 hakemusta')
  await test.step('automagically selects and saves only talousarviotili and projektikoodi for first hakemus', async () => {
    const projectName = answers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to select hakemus')
    }
    const hakemus1 = await hakemustenArviointiPage.selectHakemusFromList(projectName)
    await expect(hakemustenArviointiPage.saveStatusSuccess).toBeVisible()
    await expect(hakemus1.taTili.value).toContainText(talousarviotili.code)
    await expect(hakemus1.projektikoodi.value).toContainText(projektikoodi)
    await expect(hakemustenArviointiPage.saveStatusSuccess).toBeHidden({ timeout: 10000 })
  })
  await test.step('automagically selects and saves only talousarviotili and projektikoodi for 2nd hakemus', async () => {
    await hakemustenArviointiPage.toggleHakemusList.click()
    const projectName = secondAnswers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to select hakemus')
    }
    const hakemus2 = await hakemustenArviointiPage.selectHakemusFromList(projectName)
    await expect(hakemustenArviointiPage.saveStatusSuccess).toBeVisible()
    await expect(hakemus2.taTili.value).toContainText(talousarviotili.code)
    await expect(hakemus2.projektikoodi.value).toContainText(projektikoodi)
  })
})
