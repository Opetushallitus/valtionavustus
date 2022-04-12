import {Locator, Page} from "@playwright/test";

import {navigateHakija} from "../utils/navigate";
import {TEST_Y_TUNNUS} from "../utils/constants";
import {
  clickElementWithText,
  expectQueryParameter,
  expectToBeDefined
} from "../utils/util";
import {
  getHakemusUrlFromEmail,
  pollUntilNewHakemusEmailArrives
} from "../utils/emails";
import {Budget, defaultBudget} from "../utils/budget";
import {Answers} from "../utils/types";

export class HakijaAvustusHakuPage {
  readonly page: Page
  readonly sendHakemusButton: Locator
  readonly officerEditSubmitButton: Locator
  readonly previewContainer: Locator

  constructor(page: Page) {
    this.page = page;
    this.sendHakemusButton = page.locator('#topbar #form-controls button#submit')
    this.officerEditSubmitButton = page.locator('#virkailija-edit-submit')
    this.previewContainer = page.locator('div.soresu-preview')
  }

  async navigate(avustushakuID: number, lang: 'fi' | 'sv' | undefined) {
    await navigateHakija(this.page, `/avustushaku/${avustushakuID}/?lang=${lang ?? 'fi'}`)
  }

  async navigateToNewHakemusPage(avustushakuID: number, hakijaEmailAddress: string) {
    const receivedEmail = await pollUntilNewHakemusEmailArrives(avustushakuID, hakijaEmailAddress)
    const hakemusUrl = getHakemusUrlFromEmail(receivedEmail[0])
    expectToBeDefined(hakemusUrl)

    await this.page.goto(hakemusUrl)
  }

  async navigateToExistingHakemusPage(avustushakuID: number, userKey: string) {
    await navigateHakija(this.page, `/avustushaku/${avustushakuID}/nayta?hakemus=${userKey}`)
  }

  async navigateToYhteyshenkilöChangePage(avustushakuId: number, userKey: string, token: string) {
    await navigateHakija(this.page, `/avustushaku/${avustushakuId}/nayta?avustushaku=${avustushakuId}&hakemus=${userKey}&lang=fi&preview=false&token=${token}&refuse-grant=false&modify-application=true`)
  }

  async selectMaakuntaFromDropdown(text: string) {
    const maakuntaInputSelector = '#koodistoField-1_input .rw-dropdown-list-input input'
    await this.page.fill(maakuntaInputSelector, text)
    await this.page.press('body', 'ArrowDown')
    await this.page.press('body', 'Enter')
  }

  async waitForEditSaved() {
    return this.page.waitForFunction(
      () => document.querySelector('div.save-message')?.textContent?.includes('Tallennettu')
    )
  }

  async waitForPreview() {
    return this.previewContainer.waitFor()
  }

  async submitOfficerEdit() {
    await this.officerEditSubmitButton.click()
    await this.waitForPreview()
  }

  async submitChangeRequestResponse() {
    await this.page.click('#change-request-response')
    await this.waitForPreview()
  }

  async submitApplication() {
    await this.sendHakemusButton.click()
    await this.page.waitForSelector('button:has-text("Hakemus lähetetty"), button:has-text("Ansökan sänd")')
    return { userKey: await this.getUserKey() }
  }

  async startApplication(avustushakuID: number, contactPersonEmail: string) {
    await this.page.waitForSelector('#haku-not-open', { state: 'hidden' })
    await this.page.fill("#primary-email", contactPersonEmail)
    await this.page.click("#submit:not([disabled])")

    const receivedEmail = await pollUntilNewHakemusEmailArrives(avustushakuID, contactPersonEmail)
    const hakemusUrl = getHakemusUrlFromEmail(receivedEmail[0])
    expectToBeDefined(hakemusUrl)
    return hakemusUrl
  }

  async fillInBusinessId(businessId: string) {
    await this.page.fill("#finnish-business-id", businessId)
    await this.page.click("input.get-business-id")
  }

  async fillMuutoshakemusEnabledHakemus(avustushakuID: number, answers: Answers, beforeSubmitFn?: () => void) {
    const lang = answers.lang || 'fi'

    const hakemusUrl = await this.startApplication(avustushakuID, answers.contactPersonEmail)
    await this.page.goto(hakemusUrl)

    await this.fillInBusinessId(TEST_Y_TUNNUS)

    await this.page.fill("#applicant-name", answers.contactPersonName)
    await this.page.fill("[id='textField-0']", answers.contactPersonPhoneNumber)
    await this.page.fill("[id='signatories-fieldset-1.name']", "Erkki Esimerkki")
    await this.page.fill("[id='signatories-fieldset-1.email']", answers.contactPersonEmail)
    await clickElementWithText(this.page,"label", lang === 'fi' ? "Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko" : "Kommun/samkommun, kommunalt ägda bolag, kyrkan")
    await this.page.click("[id='koodistoField-1_input']")
    await this.selectMaakuntaFromDropdown(lang === 'fi' ? "Kainuu" : 'Åland')
    await this.page.fill("#bank-iban", "FI95 6682 9530 0087 65")
    await this.page.fill("#bank-bic", "OKOYFIHH")
    await this.page.fill("#textField-2", "2")
    await this.page.fill("#textField-1", "20")
    await this.page.fill("#project-name", answers.projectName)
    await this.page.click( `[for='language.radio.${lang === 'sv' ? 1 : 0}']`)
    await this.page.click("[for='checkboxButton-0.checkbox.0']")
    await clickElementWithText(this.page, "label", lang === 'fi' ? "Opetuksen lisääminen" : "Ordnande av extra undervisning")
    await this.page.fill("[id='project-description.project-description-1.goal']", "Tarvitsemme kuutio tonneittain rahaa jotta voimme kylpeä siinä.")
    await this.page.fill("[id='project-description.project-description-1.activity']", "Kylvemme rahassa ja rahoitamme rahapuita.")
    await this.page.fill("[id='project-description.project-description-1.result']", "Koko budjetti käytetään ja lisää aiotaan hakea.")
    await this.page.fill("[id='project-effectiveness']", "Hanke vaikuttaa ylempään ja keskikorkeaan johtoportaaseen.")
    await this.page.fill("[id='project-begin']", "13.03.1992")
    await this.page.fill("[id='project-end']", "13.03.2032")
    await this.page.click("[for='vat-included.radio.0']")
    await this.page.fill("[id='personnel-costs-row.description']", "Pieninä seteleinä kiitos.")
    await this.page.fill("[id='personnel-costs-row.amount']", "69420666")
    await this.page.fill("[id='self-financing-amount']", "1")

    if (beforeSubmitFn) {
      await beforeSubmitFn()
    }

    await this.page.waitForSelector( "#submit:not([disabled])")
  }
  async fillAndSendMuutoshakemusEnabledHakemus(avustushakuID: number, answers: Answers, beforeSubmitFn?: () => void) {
    await this.fillMuutoshakemusEnabledHakemus(avustushakuID, answers, beforeSubmitFn)
    await this.submitApplication()
    const userKey = await this.getUserKey()
    return {userKey}
  }

  async getUserKey(): Promise<string> {
    return await expectQueryParameter(this.page, "hakemus")
  }

  async fillBudget(budget: Budget = defaultBudget, type: 'hakija' | 'virkailija') {
    const prefix = type === 'virkailija' ? 'budget-edit-' : ''

    await this.page.fill(`[id='${prefix}personnel-costs-row.description']`, budget.description.personnel)
    await this.page.fill(`[id='${prefix}personnel-costs-row.amount']`, budget.amount.personnel)
    await this.page.fill(`[id='${prefix}material-costs-row.description']`, budget.description.material)
    await this.page.fill(`[id='${prefix}material-costs-row.amount']`, budget.amount.material)
    await this.page.fill(`[id='${prefix}equipment-costs-row.description']`, budget.description.equipment)
    await this.page.fill(`[id='${prefix}equipment-costs-row.amount']`, budget.amount.equipment)
    await this.page.fill(`[id='${prefix}service-purchase-costs-row.description']`, budget.description['service-purchase'])
    await this.page.fill(`[id='${prefix}service-purchase-costs-row.amount']`, budget.amount['service-purchase'])
    await this.page.fill(`[id='${prefix}rent-costs-row.description']`, budget.description.rent)
    await this.page.fill(`[id='${prefix}rent-costs-row.amount']`, budget.amount.rent)
    await this.page.fill(`[id='${prefix}steamship-costs-row.description']`, budget.description.steamship)
    await this.page.fill(`[id='${prefix}steamship-costs-row.amount']`, budget.amount.steamship)
    await this.page.fill(`[id='${prefix}other-costs-row.description']`, budget.description.other)
    await this.page.fill(`[id='${prefix}other-costs-row.amount']`, budget.amount.other)

    if (type === 'hakija') {
      await this.page.fill(`[id='${prefix}self-financing-amount']`, budget.selfFinancing)
    }
  }

  async fillBudjettimuutoshakemusEnabledHakemus(avustushakuID: number, answers: Answers, budget?: Budget) {
    const lang = answers.lang || 'fi'

    const hakemusUrl = await this.startApplication(avustushakuID, answers.contactPersonEmail)
    await this.page.goto(hakemusUrl)

    await this.fillInBusinessId(TEST_Y_TUNNUS)

    await this.page.fill("#applicant-name", answers.contactPersonName)
    await this.page.fill("[id='textField-0']", answers.contactPersonPhoneNumber)
    await this.page.fill("[id='signatories-fieldset-1.name']", "Erkki Esimerkki")
    await this.page.fill("[id='signatories-fieldset-1.email']", "erkki.esimerkki@example.com")
    await clickElementWithText(this.page,"label", lang === 'fi' ? "Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko" : "Kommun/samkommun, kommunalt ägda bolag, kyrkan")
    await this.page.click( "[id='koodistoField-1_input']")
    await this.selectMaakuntaFromDropdown(lang === 'fi' ? "Kainuu" : 'Åland')
    await this.page.fill("#bank-iban", "FI95 6682 9530 0087 65")
    await this.page.fill("#bank-bic", "OKOYFIHH")
    await this.page.fill("#textField-2", "2")
    await this.page.fill("#textField-1", "20")
    await this.page.fill("#project-name", answers.projectName)
    await this.page.click( `[for='language.radio.${lang === 'sv' ? 1 : 0}']`)
    await this.page.click( "[for='checkboxButton-0.checkbox.0']")
    await clickElementWithText(this.page, "label", lang === 'fi' ? "Opetuksen lisääminen" : "Ordnande av extra undervisning")
    await this.page.fill("[id='project-description.project-description-1.goal']", "Jonain päivänä teemme maailman suurimman aallon.")
    await this.page.fill("[id='project-description.project-description-1.activity']", "Teemme aaltoja joka dailyssa aina kun joku on saanut tehtyä edes jotain.")
    await this.page.fill("[id='project-description.project-description-1.result']", "Hankkeeseen osallistuneiden hartiat vetreytyvät suunnattomasti.")
    await this.page.fill("[id='project-effectiveness']", "Käsienheiluttelu kasvaa suhteessa muuhun tekemiseen huomattavasti")
    await this.page.fill("[id='project-begin']", "13.03.1992")
    await this.page.fill("[id='project-end']", "13.03.2032")
    await this.page.click( '[for="vat-included.radio.0"]')

    if (answers.organization) {
      await this.page.fill("#organization", answers.organization)
    }

    await this.fillBudget(budget, 'hakija')
  }
}
