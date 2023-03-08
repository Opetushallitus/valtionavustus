import { Page } from '@playwright/test'

const outcomeLocator = (page: Page, radioNumber: number) =>
  page.locator(`label[for='project-outcomes.project-outcomes-1.outcome-type.radio.${radioNumber}']`)

const goodPracticeLocator = (page: Page, radioNumber: 0 | 1) =>
  page.locator(`label[for='radioButton-good-practices.radio.${radioNumber}']`)

export const HakijaSelvitysPage = (page: Page) => ({
  page,
  organization: page.locator(`[name='organization']`),
  projectName: page.locator(`[name='project-name']`),
  projectGoal: page.locator(`[name='project-description.project-description-1.goal']`),
  projectActivity: page.locator(`[name='project-description.project-description-1.activity']`),
  projectResult: page.locator(`[name='project-description.project-description-1.result']`),
  textArea: (areaNumber: number) => page.locator(`[name='textArea-${areaNumber}']`),
  outcomeTypeRadioButtons: {
    operatingModel: outcomeLocator(page, 0),
    report: outcomeLocator(page, 1),
    release: outcomeLocator(page, 2),
    somethingElse: outcomeLocator(page, 3),
  },
  outcomeDescription: page.locator(`[name='project-outcomes.project-outcomes-1.description']`),
  outcomeAddress: page.locator(`[name='project-outcomes.project-outcomes-1.address']`),
  goodPracticesRadioButtons: {
    yes: goodPracticeLocator(page, 0),
    no: goodPracticeLocator(page, 1),
  },
  firstAttachment: page.locator(`[name='namedAttachment-0']`),
  submitButton: page.locator('#submit'),
  valiselvitysWarning: page.locator('text="Väliselvityksen jättämisen määräaika on umpeutunut"'),
  loppuselvitysWarning: page.locator('text="Loppuselvityksen jättämisen määräaika on umpeutunut"'),
})
