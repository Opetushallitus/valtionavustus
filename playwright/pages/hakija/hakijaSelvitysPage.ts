import { Page } from '@playwright/test'
import { dummyPdfPath } from '../../utils/constants'

const outcomeLocator = (page: Page, radioNumber: number) =>
  page.locator(`label[for='project-outcomes.project-outcomes-1.outcome-type.radio.${radioNumber}']`)

const goodPracticeLocator = (page: Page, radioNumber: 0 | 1) =>
  page.locator(`label[for='radioButton-good-practices.radio.${radioNumber}']`)

export const HakijaSelvitysPage = (page: Page, lang: 'fi' | 'sv' = 'fi') => {
  const locators = {
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
    taydennysButton: page.getByRole('button', {
      name:
        lang === 'fi'
          ? 'Lähetä täydennys käsiteltäväksi'
          : 'Skicka kompletteringen för handläggning',
    }),
    valiselvitysWarning: page.locator('text="Väliselvityksen jättämisen määräaika on umpeutunut"'),
    loppuselvitysWarning: page.locator(
      'text="Loppuselvityksen jättämisen määräaika on umpeutunut"'
    ),
    yheyshenkiloName: page.getByLabel('Hankkeen yhteyshenkilön nimi'),
    yheyshenkiloEmail: page.locator('#primary-email'),
  }
  const fillCommonValiselvitysForm = async () => {
    await locators.organization.fill('Avustuksen saajan nimi')
    await locators.projectName.fill('Hankkeen nimi')

    await locators.projectGoal.fill('Hankkeen/toiminnan tavoite')
    await locators.projectActivity.fill('Toiminta, jolla tavoitteeseen on pyritty')
    await locators.projectResult.fill(
      'Konkreettiset tulokset, jotka tavoitteen osalta saavutettiin'
    )

    await locators
      .textArea(1)
      .fill('Miten hankkeen toimintaa, tuloksia ja vaikutuksia on arvioitu?')
    await locators.textArea(3).fill('Miten hankkeesta/toiminnasta on tiedotettu?')

    await locators.outcomeTypeRadioButtons.report.click()
    await locators.outcomeDescription.fill('Kuvaus')
    await locators.outcomeAddress.fill('Saatavuustiedot, www-osoite tms.')
    await locators.goodPracticesRadioButtons.no.click()
    await locators.textArea(4).fill('Lisätietoja')
    await locators.firstAttachment.setInputFiles(dummyPdfPath)
  }
  const fillCommonLoppuselvitysForm = async () => {
    await locators.textArea(0).fill('Yhteenveto')
    await locators.textArea(2).fill('Työn jako')
    await locators.projectGoal.fill('Tavoite')
    await locators.projectActivity.fill('Toiminta')
    await locators.projectResult.fill('Tulokset')
    await locators.textArea(1).fill('Arviointi')
    await locators.textArea(3).fill('Tiedotus')

    await locators.outcomeTypeRadioButtons.operatingModel.click()
    await locators.outcomeDescription.fill('Kuvaus')
    await locators.outcomeAddress.fill('Saatavuustiedot')

    await locators.goodPracticesRadioButtons.no.click()
    await locators.textArea(4).fill('Lisätietoja')

    await locators.firstAttachment.setInputFiles(dummyPdfPath)
  }
  return {
    ...locators,
    fillCommonValiselvitysForm,
    fillCommonLoppuselvitysForm,
  }
}
