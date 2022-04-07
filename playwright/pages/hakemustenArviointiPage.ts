import {expect, Locator, Page} from "@playwright/test";

import { navigate } from "../utils/navigate";
import {
  clickElementWithText,
  expectToBeDefined,
  getChangedBudgetTableCells,
  getExistingBudgetTableCells,
} from "../utils/util";
import {VIRKAILIJA_URL} from "../utils/constants";

import { MuutoshakemusValues, PaatosStatus, PaatosValues } from "../utils/types";
import { AcceptedBudget, Budget, BudgetAmount, defaultBudget } from "../utils/budget";
import { HakijaAvustusHakuPage } from "./hakijaAvustusHakuPage";

const jatkoaikaSelector = '[data-test-id=muutoshakemus-jatkoaika]' as const

export class HakemustenArviointiPage {
  readonly page: Page
  readonly avustushakuDropdown: Locator
  readonly inputFilterOrganization: Locator
  readonly inputFilterProject: Locator
  readonly hakemusListing: Locator
  readonly showUnfinished: Locator
  readonly hakemusRows: Locator

  constructor(page: Page) {
    this.page = page;
    this.avustushakuDropdown = this.page.locator('#avustushaku-dropdown')
    this.inputFilterOrganization = this.page.locator('[placeholder="Hakijaorganisaatio"]')
    this.inputFilterProject = this.page.locator('[placeholder="Hanke tai asianumero"]')
    this.hakemusListing = this.page.locator('#hakemus-listing')
    this.showUnfinished = this.page.locator('text="Näytä keskeneräiset"')
    this.hakemusRows = this.hakemusListing.locator('tbody tr')
  }

  async navigate(avustushakuID: number, options?: { showAll?: boolean, newListingUi?: boolean }) {
    const params = new URLSearchParams()
    if (options?.showAll) {
      params.append('showAll', 'true')
    }
    if (options?.newListingUi) {
      params.append('new-hakemus-listing-ui', 'true')
    }
    await navigate(this.page, `/avustushaku/${avustushakuID}/?${params.toString()}`)
  }

  async navigateToLatestHakemusArviointi(avustushakuID: number): Promise<number> {
    await navigate(this.page, `/avustushaku/${avustushakuID}/`)
    await this.page.click('tbody tr:first-of-type')
    await this.page.waitForSelector('#hakemus-details')
    return await this.page.evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1]).then(possibleHakemusID => {
      expectToBeDefined(possibleHakemusID)
      return parseInt(possibleHakemusID)
    })
  }

  async navigateToLatestMuutoshakemus(avustushakuID: number, hakemusID: number) {
    await navigate(this.page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/muutoshakemukset/`)
    await this.page.waitForSelector('#tab-content')
  }

  async clickHakemus(hakemusID: number) {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(`#hakemus-${hakemusID}`)
    ])
  }

  async search(text: string) {
    const searchSelector = '[aria-label="Enter your search term"]'
    await this.page.fill(searchSelector, text);
    await this.page.press(searchSelector, 'Enter');
  }

  async openUkotusModal(hakemusID: number) {
    await this.page.click(`#hakemus-${hakemusID} .btn-role`)
  }

  async closeUkotusModal() {
    await this.page.click('[aria-label="Sulje valmistelija ja arvioija valitsin"]')
  }

  async openHakemusEditPage(reason: string = 'Kunhan editoin'): Promise<HakijaAvustusHakuPage> {
    await this.page.click('[data-test-id=virkailija-edit-hakemus]')
    await this.page.type('[data-test-id=virkailija-edit-comment]', reason)
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.click('[data-test-id=virkailija-edit-submit]')
    ])
    await newPage.bringToFront()
    return new HakijaAvustusHakuPage(newPage)
  }

  async createChangeRequest(reason: string = "Täydennäppä") {
    await this.page.click('[data-test-id="request-change-button"]')
    await this.page.type('[data-test-id="täydennyspyyntö__textarea"]', reason)
    await this.page.click('[data-test-id="täydennyspyyntö__lähetä"]')
  }

  async waitForArvioSave(avustushakuID: number, hakemusID: number) {
    await this.page.waitForResponse(response =>
      response.url() === `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`
      && response.ok()
    )
  }

  async selectValmistelijaForHakemus(hakemusID: number, valmistelijaName: string) {
    await this.openUkotusModal(hakemusID)
    await this.page.click(`[aria-label="Lisää ${valmistelijaName} valmistelijaksi"]`)
    await this.page.locator(`[aria-label="Poista ${valmistelijaName} valmistelijan roolista"]`).waitFor()
    await this.closeUkotusModal()
  }

  async selectArvioijaForHakemus(hakemusID: number, valmistelijaName: string) {
    await this.openUkotusModal(hakemusID)
    await this.page.click(`[aria-label="Lisää ${valmistelijaName} arvioijaksi"]`)
    await this.page.locator(`[aria-label="Poista ${valmistelijaName} arvioijan roolista"]`).waitFor()
    await this.closeUkotusModal()
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

  async acceptBudget(budget: AcceptedBudget) {
    if (typeof budget === 'string') {
      await this.page.fill("#budget-edit-project-budget .amount-column input", budget)
    } else {
      await this.page.click( 'label[for="useDetailedCosts-true"]')
      await this.fillBudget(budget, 'virkailija')
    }
  }

  async acceptAvustushaku(
    avustushakuID: number,
    projectName: string,
    budget: AcceptedBudget = "100000",
    rahoitusalue = "Ammatillinen koulutus",
  ) {
    // Accept the hakemus
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(`text=${projectName}`)
    ])

    const hakemusID = await this.page.evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1]).then(possibleHakemusID => {
      expectToBeDefined(possibleHakemusID)
      return parseInt(possibleHakemusID)
    })

    expectToBeDefined(hakemusID)
    console.log("Hakemus ID:", hakemusID)

    await this.page.click(`label:has-text("${rahoitusalue}")`)

    await this.acceptHakemus(budget)
    await this.waitForArvioSave(avustushakuID, hakemusID)
    return hakemusID
  }

  async acceptHakemus(budget: AcceptedBudget = "100000") {
    await this.page.click("#arviointi-tab label[for='set-arvio-status-plausible']")
    await this.acceptBudget(budget)
    await this.page.click("#arviointi-tab label[for='set-arvio-status-accepted']")
  }

  statusFieldSelector(hakemusID: number) {
    return `[data-test-id=muutoshakemus-status-${hakemusID}]`
  }

  async väliselvitysStatus(hakemusID: number) {
    return await this.page.innerText(`tr#hakemus-${hakemusID} >> [data-test-id=väliselvitys-column]`)
  }

  async muutoshakemusStatusFieldContent(hakemusID: number) {
    const handle = await this.page.waitForSelector(this.statusFieldSelector(hakemusID))
    return await handle.textContent()
  }

  async clickMuutoshakemusStatusField(hakemusID: number) {
    await this.page.click(this.statusFieldSelector(hakemusID))
  }

  async clickMuutoshakemusTab() {
    await this.page.click('span.muutoshakemus-tab')
    await this.page.waitForSelector(jatkoaikaSelector)
  }

  async validateMuutoshakemusValues(muutoshakemus: MuutoshakemusValues, paatos?: PaatosValues) {
    const jatkoaika = await this.page.textContent(jatkoaikaSelector)
    expect(jatkoaika).toEqual(muutoshakemus.jatkoaika?.format('DD.MM.YYYY'))
    const jatkoaikaPerustelu = await this.page.textContent('[data-test-id=muutoshakemus-jatkoaika-perustelu]')
    expect(jatkoaikaPerustelu).toEqual(muutoshakemus.jatkoaikaPerustelu)

    if (paatos) {
      await this.page.waitForSelector('[data-test-id="muutoshakemus-paatos"]')
      const form = await this.page.evaluate((selector: string) => document.querySelectorAll(selector).length, '[data-test-id="muutoshakemus-form"]')
      expect(form).toEqual(0)
      const muutospaatosLink = await this.page.textContent('a.muutoshakemus__paatos-link')
      expect(muutospaatosLink).toMatch(/https?:\/\/[^\/]+\/muutoshakemus\/paatos\?user-key=[a-f0-9]{64}/)
    } else {
      await this.page.waitForSelector('[data-test-id="muutoshakemus-form"]')
    }
  }

  async selectVakioperusteluInFinnish() {
    await clickElementWithText(this.page, 'a', 'Lisää vakioperustelu suomeksi')
  }

  async getSisaltomuutosPerustelut() {
    return this.page.innerText('[data-test-id="sisaltomuutos-perustelut"]')
  }

  async getMuutoshakemusNotice() {
    return this.page.innerText('.muutoshakemus-notice')
  }

  paatosPreview() {
    return {
      perustelut: this.page.locator('[data-test-id="muutoshakemus-form-paatos-reason"]'),
      open: async () => {
        await Promise.all([
          this.page.click('text=Esikatsele päätösdokumentti'),
          this.page.waitForSelector('.muutoshakemus-paatos__content')
        ])
      },
      close: async () => {
        await Promise.all([
          this.page.waitForSelector('.muutoshakemus-paatos__content', { state: 'detached' }),
          this.page.click('text=Sulje')
        ])
      },
      title: this.page.locator('.hakemus-details-modal__title-row > span'),
      muutoshakemusPaatosTitle: this.page.locator('[data-test-id=muutoshakemus-paatos-title]'),
      jatkoaikaPaatos: this.page.locator('[data-test-id="paatos-jatkoaika"]'),
      jatkoaikaValue: this.page.locator('[data-test-id="paattymispaiva-value"]'),
      sisaltoPaatos: this.page.locator('[data-test-id="paatos-sisaltomuutos"]'),
      talousarvioPaatos:  this.page.locator('[data-test-id="paatos-talousarvio"]'),
      esittelija: this.page.locator('[data-test-id="paatos-esittelija"]'),
      lisatietoja: this.page.locator('[data-test-id="paatos-additional-info"]'),
      hyvaksyja: this.page.locator('[data-test-id="paatos-decider"]'),
      registerNumber: this.page.locator('[data-test-id="paatos-register-number"]'),
      projectName: this.page.locator('[data-test-id="paatos-project-name"]'),
      org: this.page.locator('h1.muutoshakemus-paatos__org'),
      perustelu: this.page.locator('[data-test-id="paatos-reason"]'),
      existingBudgetTableCells: () => getExistingBudgetTableCells(this.page, '.muutoshakemus-paatos__content [data-test-id="meno-input-row"]'),
      changedBudgetTableCells: () => getChangedBudgetTableCells(this.page, '.muutoshakemus-paatos__content [data-test-id="meno-input-row"]')
    }
  }

  async setMuutoshakemusJatkoaikaDecision(status: PaatosStatus, value?: string) {
    await this.page.click(`label[for="haen-kayttoajan-pidennysta-${status}"]`)
    if (value) {
      await this.page.fill('div.datepicker input', value)
    }
  }

  async writePerustelu(text: string) {
    await this.page.fill('#reason', text)
  }

  async setMuutoshakemusSisaltoDecision(status: PaatosStatus) {
    await this.page.click(`label[for="haen-sisaltomuutosta-${status}"]`)
  }

  async fillMuutoshakemusBudgetAmount(budget: BudgetAmount) {
    await this.page.fill( "input[name='talousarvio.personnel-costs-row'][type='number']", budget.personnel)
    await this.page.fill( "input[name='talousarvio.material-costs-row'][type='number']", budget.material)
    await this.page.fill( "input[name='talousarvio.equipment-costs-row'][type='number']", budget.equipment)
    await this.page.fill( "input[name='talousarvio.service-purchase-costs-row'][type='number']", budget['service-purchase'])
    await this.page.fill( "input[name='talousarvio.rent-costs-row'][type='number']", budget.rent)
    await this.page.fill( "input[name='talousarvio.steamship-costs-row'][type='number']", budget.steamship)
    await this.page.fill( "input[name='talousarvio.other-costs-row'][type='number']", budget.other)
  }

  async setMuutoshakemusBudgetDecision(status: PaatosStatus, value?: BudgetAmount) {
    if (status) {
      await this.page.click(`label[for="talousarvio-${status}"]`)
    }
    if (value) {
      await this.fillMuutoshakemusBudgetAmount(value)
    }
  }

  async saveMuutoshakemus() {
    await this.page.click('[data-test-id="muutoshakemus-submit"]')
    await this.page.waitForSelector('[data-test-id="muutoshakemus-paatos"]')
    const statusText = await this.page.textContent('[data-test-id="paatos-status-text"]')
    expect(statusText).toEqual('Käsitelty')
  }

  async getAcceptedBudgetInputAmounts(): Promise<{ name: string; value: string }[]> {
    const inputs = await this.page.$$('[data-test-id="muutoshakemus-form"] [data-test-id="meno-input"] > input')
    return Promise.all(inputs.map(async (elem) => {
      const name = (await elem.getAttribute('name'))?.replace('talousarvio.', '') || ''
      const value = await elem.inputValue()
      return { name, value }
    }))
  }

  async setSelectionCriteriaStars(questionNumber: number, starValue: number) {
    await this.page.click(`.valintaperuste-list tr.single-valintaperuste:nth-of-type(${questionNumber}) img:nth-of-type(${starValue})`)
  }

  async getHakemusScore(hakemusId: number): Promise<string | undefined> {
    const title = await this.page.locator(`#hakemus-${hakemusId} .list-score-row`).getAttribute('title')
    const regex = title?.match(/.*Keskiarvo\: ([\S]+).*/)
    return regex?.[1]
  }
}
