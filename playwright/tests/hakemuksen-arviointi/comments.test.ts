import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'

test('virkailija can add comments', async ({
  page,
  closedAvustushaku: { id: avustushakuID },
  answers,
}) => {
  const projectName = answers.projectName
  if (!projectName) {
    throw new Error('projectName must be set in order to select hakemus')
  }
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(projectName)
  const arviointiTab = hakemustenArviointiPage.arviointiTabLocators()
  const comments = arviointiTab.comments
  expect(await comments.comment.allTextContents()).toHaveLength(0)
  await expect(comments.sendButton).toBeDisabled()
  await comments.input.fill('ei jatkoon')
  await comments.sendButton.click()
  await comments.commentAdded.waitFor()
  await expect(comments.sendButton).toBeDisabled()
  await expect(comments.comment.first()).toHaveText('_ V: ei jatkoon')
})
