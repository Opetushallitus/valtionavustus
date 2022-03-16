import { Page } from "@playwright/test";

export const HakijaSelvitysPage = (page: Page) => ({
  page,
  organization: page.locator(`[name='organization']`),
  projectName: page.locator(`[name='project-name']`),
  projectGoal: page.locator(`[name='project-description.project-description-1.goal']`),
  projectActivity: page.locator(`[name='project-description.project-description-1.activity']`),
  projectResult: page.locator(`[name='project-description.project-description-1.result']`),
  textArea1: page.locator(`[name='textArea-1']`),
  textArea3: page.locator(`[name='textArea-3']`),
  outcomeRadioBtn: page.locator(`label[for='project-outcomes.project-outcomes-1.outcome-type.radio.1']`),
  outcomeDescription: page.locator(`[name='project-outcomes.project-outcomes-1.description']`),
  outcomeAddress: page.locator(`[name='project-outcomes.project-outcomes-1.address']`),
  goodPracticesRadioBtn: page.locator("label[for='radioButton-good-practices.radio.1']"),
  textArea4: page.locator(`[name='textArea-4']`),
  firstAttachment: page.locator(`[name='namedAttachment-0']`),
  submitButton: page.locator('#submit'),
  valiselvitysWarning: page.locator('text="Väliselvityksen jättämisen määräaika on umpeutunut"')
})
