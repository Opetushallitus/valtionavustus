import { expect, Locator, Page } from '@playwright/test'

import { navigate } from '../../../utils/navigate'
import {
  expectToBeDefined,
  getChangedBudgetTableCells,
  getExistingBudgetTableCells,
} from '../../../utils/util'
import { VIRKAILIJA_URL } from '../../../utils/constants'

import { MuutoshakemusValues, PaatosStatus, PaatosValues, VaCodeValues } from '../../../utils/types'
import { AcceptedBudget, BudgetAmount, fillBudget } from '../../../utils/budget'
import { HakijaAvustusHakuPage } from '../../hakija/hakijaAvustusHakuPage'
import { createReactSelectLocators } from '../../../utils/react-select'
import { Header } from '../Header'
import { LoppuselvitysPage } from '../hakujen-hallinta/LoppuselvitysPage'
import { createMuutoshakemusTab } from './MuutoshakemusTab'
import { createViestiHankkeelleTab, ViestiHankkeelleTab } from './ViestiHankkeelleTab'
import * as xlsx from 'xlsx'

const jatkoaikaTestId = 'muutoshakemus-jatkoaika'

export class HakemustenArviointiPage {
  readonly page: Page
  readonly header: ReturnType<typeof Header>

  readonly avustushakuDropdown: Locator
  readonly inputFilterOrganization: Locator
  readonly inputFilterProject: Locator
  readonly hakemusListing: Locator
  readonly showUnfinished: Locator
  readonly hakemusRows: Locator
  readonly toggleHakemusList: Locator
  readonly taydennyspyynto: Locator
  readonly sendTaydennyspyynto: Locator
  readonly saveStatus: Locator
  readonly saveStatusSuccess: Locator
  readonly saveStatusLoading: Locator
  readonly saveStatusSaving: Locator

  constructor(page: Page) {
    this.page = page
    this.avustushakuDropdown = this.page.locator('#avustushaku-dropdown')
    this.inputFilterOrganization = this.page.getByPlaceholder('Hakijaorganisaatio')
    this.inputFilterProject = this.page.getByPlaceholder('Asiatunnus tai hanke')
    this.hakemusListing = this.page.locator('#hakemus-listing')
    this.showUnfinished = this.page.locator('text="Näytä keskeneräiset"')
    this.hakemusRows = this.hakemusListing.locator('tbody tr')
    this.toggleHakemusList = this.page.locator('#toggle-hakemus-list-button')
    this.header = Header(this.page)
    this.taydennyspyynto = this.page.getByRole('textbox', {
      name: 'Kirjoita tähän hakijalle täydennyspyyntö ja määräaika, johon mennessä hakijan tulee vastata täydennyspyyntöön',
    })
    this.sendTaydennyspyynto = this.page.getByRole('button', { name: 'Lähetä' })
    this.saveStatus = this.page.getByTestId('save-status')
    this.saveStatusLoading = this.saveStatus.getByText('Ladataan tietoja')
    this.saveStatusSaving = this.saveStatus.getByText('Tallennetaan')
    this.saveStatusSuccess = this.saveStatus.getByText('Kaikki tiedot tallennettu')
  }

  async navigate(
    avustushakuID: number,
    options?: {
      showAll?: boolean
      showAdditionalInfo?: boolean
      splitView?: boolean
    }
  ) {
    const params = new URLSearchParams()
    if (options?.showAll) {
      params.append('showAll', 'true')
    }
    if (options?.showAdditionalInfo) {
      params.append('showAdditionalInfo', 'true')
    }
    if (options?.splitView) {
      params.append('splitView', 'true')
    }
    await navigate(this.page, `/avustushaku/${avustushakuID}/?${params.toString()}`)
  }

  async navigateToLatestHakemusArviointi(
    avustushakuID: number,
    isDraft: boolean = false
  ): Promise<number> {
    await navigate(this.page, `/avustushaku/${avustushakuID}/`)
    if (isDraft) {
      await this.showUnfinished.check()
    }
    await this.page.click('tbody tr:first-of-type')
    await this.page.waitForURL(`**/avustushaku/${avustushakuID}/hakemus/**`)
    return await this.page
      .evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1])
      .then((possibleHakemusID) => {
        expectToBeDefined(possibleHakemusID)
        return parseInt(possibleHakemusID)
      })
  }

  async navigateToLatestMuutoshakemus(avustushakuID: number, hakemusID: number) {
    await navigate(
      this.page,
      `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/muutoshakemukset/`
    )
    await expect(this.page.locator('#tab-content')).toBeVisible()
    return createMuutoshakemusTab(this.page)
  }

  async navigateToHakemusArviointi(avustushakuID: number, hakemusID: number) {
    await navigate(this.page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arviointi/`)
  }

  async navigateToHakemusArviointiLoppuselvitys(avustushakuID: number, hakemusID: number) {
    await navigate(this.page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/loppuselvitys/`)
    return LoppuselvitysPage(this.page)
  }

  async navigateToHakemus(avustushakuId: number, hanke: string, options?: { showAll?: boolean }) {
    await this.navigate(avustushakuId, options)
    await this.page.click(`span:text-matches("${hanke}")`)
    await expect(
      this.page.locator('#project-name').getByText(hanke, { exact: false })
    ).toBeVisible()
  }

  async navigateToViestiHankkeelleTab(
    avustushakuID: number,
    hakemusID: number
  ): Promise<ViestiHankkeelleTab> {
    await navigate(this.page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/viesti/`)

    return createViestiHankkeelleTab(this.page)
  }

  async waitForSave() {
    await expect(this.saveStatusSuccess).toBeVisible()
  }

  async clickHakemus(hakemusID: number) {
    await this.page.getByTestId(`hakemus-${hakemusID}`).click()
    await this.page.waitForURL(`${VIRKAILIJA_URL}/avustushaku/*/hakemus/${hakemusID}/arviointi`)
  }

  async closeHakemusDetails() {
    await this.page.locator('#close-hakemus-button').click()
  }

  async openUkotusModal(hakemusID: number) {
    await this.page
      .getByTestId(`hakemus-${hakemusID}`)
      .locator(`[aria-label="Lisää valmistelija hakemukselle"]`)
      .click()
  }

  async closeUkotusModal() {
    await this.page.click('[aria-label="Sulje valmistelija ja arvioija valitsin"]')
  }

  async openHakemusEditPage(
    reason: string = 'Kunhan editoin'
  ): Promise<ReturnType<typeof HakijaAvustusHakuPage>> {
    await this.page.getByTestId('virkailija-edit-hakemus').click()
    await this.page.getByTestId('virkailija-edit-comment').pressSequentially(reason)
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.getByTestId('virkailija-edit-submit').click(),
    ])
    await newPage.bringToFront()
    return HakijaAvustusHakuPage(newPage)
  }

  async createChangeRequest(reason: string = 'Täydennäppä') {
    await this.page.getByTestId('request-change-button').click()
    await this.taydennyspyynto.pressSequentially(reason)
    await this.sendTaydennyspyynto.click()
    await this.waitForSave()
  }

  async cancelChangeRequest() {
    await this.page.getByRole('button', { name: 'Peru täydennyspyyntö' }).click()
    await this.waitForSave()
  }

  async selectValmistelijaForHakemus(hakemusID: number, valmistelijaName: string) {
    await expect(this.saveStatusSaving.or(this.saveStatusLoading)).not.toBeVisible()
    await this.openUkotusModal(hakemusID)
    await this.page.click(`[aria-label="Lisää ${valmistelijaName} valmistelijaksi"]`)
    await expect(this.saveStatusSaving).toBeVisible()
    await expect(
      this.page.locator(`[aria-label="Poista ${valmistelijaName} valmistelijan roolista"]`)
    ).toBeVisible()
    await this.waitForSave()
    await this.closeUkotusModal()
  }

  async selectArvioijaForHakemus(hakemusID: number, valmistelijaName: string) {
    await this.openUkotusModal(hakemusID)
    await this.page.click(`[aria-label="Lisää ${valmistelijaName} arvioijaksi"]`)
    await expect(
      this.page.locator(`[aria-label="Poista ${valmistelijaName} arvioijan roolista"]`)
    ).toBeVisible()
    await this.closeUkotusModal()
  }

  async fillTäydennyspyyntöField(täydennyspyyntöText: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Pyydä täydennystä' }).click()
    await this.taydennyspyynto.fill(täydennyspyyntöText)
  }

  async clickToSendTäydennyspyyntö(avustushakuID: number, hakemusID: number) {
    await Promise.all([
      this.page.waitForResponse(
        `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/change-requests`
      ),
      this.sendTaydennyspyynto.click(),
    ])
  }

  async acceptBudget(budget: AcceptedBudget) {
    if (typeof budget === 'string') {
      await this.page.fill('#budget-edit-project-budget .amount-column input', budget)
    } else {
      await this.page.click('label[for="useDetailedCosts-true"]')
      await fillBudget(this.page, budget, 'virkailija')
    }
  }

  async getHakemusID() {
    const hakemusID = await this.page
      .evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1])
      .then((possibleHakemusID) => {
        expectToBeDefined(possibleHakemusID)
        return parseInt(possibleHakemusID)
      })
    return hakemusID
  }

  async selectHakemusFromList(rowText: string) {
    await this.page.click(`text=${rowText}`)
    await expect(this.saveStatusLoading).not.toBeVisible()
    return this.arviointiTabLocators()
  }

  async selectProject(projectCode: string, codes?: VaCodeValues) {
    const { projektikoodi } = this.arviointiTabLocators()
    if (codes && codes.project.length > 1) {
      await projektikoodi.input.click()
      await projektikoodi.option.locator(`text=${projectCode}`).click()
    }
    await expect(projektikoodi.value).toContainText(projectCode)
  }

  async fillPaatoksenPerustelut(perustelut: string) {
    await this.page.fill(`#perustelut`, perustelut)
  }

  async acceptAvustushaku({
    projectName,
    budget = '100000',
    rahoitusalue = 'Ammatillinen koulutus',
    projektikoodi,
    codes,
    paatoksenPerustelut,
  }: {
    avustushakuID: number
    projectName: string
    projektikoodi: string
    budget?: AcceptedBudget
    rahoitusalue?: string
    codes?: VaCodeValues
    paatoksenPerustelut?: string
  }) {
    // Accept the hakemus
    await this.selectHakemusFromList(projectName)
    const hakemusID = await this.getHakemusID()

    await this.selectProject(projektikoodi, codes)

    if (paatoksenPerustelut) {
      await this.fillPaatoksenPerustelut(paatoksenPerustelut)
    }

    expectToBeDefined(hakemusID)
    console.log('Hakemus ID:', hakemusID)

    await expect(this.arviointiTabLocators().taTili.value).toContainText(rahoitusalue)
    await this.acceptHakemus(budget)
    await this.waitForSave()
    return hakemusID
  }

  async acceptHakemus(budget: AcceptedBudget = '100000') {
    await this.acceptBudget(budget)
    await this.page.click("#arviointi-tab label[for='set-arvio-status-accepted']")
  }

  async rejectHakemus() {
    await this.page.click("#arviointi-tab label[for='set-arvio-status-rejected']")
  }

  async submitHakemus() {
    await this.page.getByTestId('submit-hakemus').click()
  }

  statusFieldSelector(hakemusID: number) {
    return `[data-test-id=muutoshakemus-status-${hakemusID}]`
  }

  getLoppuselvitysStatus(hakemusID: number) {
    return this.getSelvitysStatus(hakemusID, 'loppu')
  }

  getVäliselvitysStatus(hakemusID: number) {
    return this.getSelvitysStatus(hakemusID, 'vali')
  }

  getSelvitysStatus(hakemusID: number, type: 'vali' | 'loppu') {
    return this.page.locator(
      `[data-test-id=\"hakemus-${hakemusID}\"] [data-test-class=${type}selvitys-status-cell]`
    )
  }

  muutoshakemusStatusFieldContent() {
    return this.page.locator('[data-test-class=muutoshakemus-status-cell]')
  }

  async clickMuutoshakemusStatusField(hakemusID: number) {
    await this.page.click(this.statusFieldSelector(hakemusID))
  }

  async clickMuutoshakemusTab() {
    await this.page.click('span.muutoshakemus-tab')
    await expect(this.page.getByTestId(jatkoaikaTestId)).toBeVisible()

    return createMuutoshakemusTab(this.page)
  }

  /** @deprecated use MuutoshakemusTab */
  async validateMuutoshakemusValues(muutoshakemus: MuutoshakemusValues, paatos?: PaatosValues) {
    await expect(this.page.getByTestId(jatkoaikaTestId)).toHaveText(
      muutoshakemus.jatkoaika!.format('DD.MM.YYYY')
    )
    const jatkoaikaPerustelu = await this.page.textContent(
      '[data-test-id=muutoshakemus-jatkoaika-perustelu]'
    )
    expect(jatkoaikaPerustelu).toEqual(muutoshakemus.jatkoaikaPerustelu)

    if (paatos) {
      await expect(this.page.getByTestId('muutoshakemus-paatos')).toBeVisible()
      const form = await this.page.evaluate(
        (selector: string) => document.querySelectorAll(selector).length,
        '[data-test-id="muutoshakemus-form"]'
      )
      expect(form).toEqual(0)
      const muutospaatosLink = await this.page.textContent('a.muutoshakemus__paatos-link')
      expect(muutospaatosLink).toMatch(
        /https?:\/\/[^\/]+\/muutoshakemus\/paatos\?user-key=[a-f0-9]{64}/
      )
    } else {
      await expect(this.page.getByTestId('muutoshakemus-form')).toBeVisible()
    }
  }

  /** @deprecated use MuutoshakemusTab */
  async selectVakioperusteluInFinnish() {
    await this.page.getByText('Lisää vakioperustelu suomeksi').click()
  }

  /** @deprecated use MuutoshakemusTab */
  paatosPreview() {
    return {
      open: async () => {
        await Promise.all([
          this.page.click('text=Esikatsele päätösdokumentti'),
          this.page.waitForSelector('.muutoshakemus-paatos__content'),
        ])
      },
      close: async () => {
        await Promise.all([
          this.page.waitForSelector('.muutoshakemus-paatos__content', {
            state: 'detached',
          }),
          this.page.click('text=Sulje'),
        ])
      },
      title: this.page.locator('.hakemus-details-modal__title-row > span'),
      muutoshakemusPaatosTitle: this.page.getByTestId('muutoshakemus-paatos-title'),
      jatkoaikaPaatos: this.page.getByTestId('paatos-jatkoaika'),
      jatkoaikaValue: this.page.getByTestId('paattymispaiva-value'),
      sisaltoPaatos: this.page.getByTestId('paatos-sisaltomuutos'),
      talousarvioPaatos: this.page.getByTestId('paatos-talousarvio'),
      esittelija: this.page.getByTestId('paatos-esittelija'),
      lisatietoja: this.page.getByTestId('paatos-additional-info'),
      hyvaksyja: this.page.getByTestId('paatos-decider'),
      registerNumber: this.page.getByTestId('paatos-register-number'),
      projectName: this.page.getByTestId('paatos-project-name'),
      org: this.page.locator('h1.muutoshakemus-paatos__org'),
      perustelu: this.page.getByTestId('paatos-reason'),
      existingBudgetTableCells: () =>
        getExistingBudgetTableCells(
          this.page,
          '.muutoshakemus-paatos__content [data-test-id="meno-input-row"]'
        ),
      changedBudgetTableCells: () =>
        getChangedBudgetTableCells(
          this.page,
          '.muutoshakemus-paatos__content [data-test-id="meno-input-row"]'
        ),
    }
  }

  additionalInfo() {
    return {
      locators: {
        showAdditionalInfo: this.page.locator('text="Näytä lisätiedot"'),
        hideAdditionalInfo: this.page.locator('text="Piilota lisätiedot"'),
        toimintayksikko: this.page.getByTestId('lisatiedot-Toimintayksikkö'),
        vastuuvalmistelija: this.page.getByTestId('lisatiedot-Vastuuvalmistelija'),
        paatokset: this.page.locator('[data-test-id="lisatiedot-Päätökset"]'),
        maksatukset: this.page.getByTestId('lisatiedot-Maksatukset'),
        valiselvitykset: this.page.getByTestId('lisatiedot-Väliselvitykset'),
        loppuselvitykset: this.page.getByTestId('lisatiedot-Loppuselvitykset'),
        muutoshakukelpoinen: this.page.getByTestId('lisatiedot-Muutoshakukelpoinen'),
        budjetti: this.page.getByTestId('lisatiedot-Budjetti'),
      },
    }
  }

  /** @deprecated use MuutoshakemusTab */
  async setMuutoshakemusJatkoaikaDecision(status: PaatosStatus, value?: string) {
    await this.page.click(`label[for="haen-kayttoajan-pidennysta-${status}"]`)
    if (value) {
      await this.page.fill('div.datepicker input', value)
    }
  }

  /** @deprecated use MuutoshakemusTab */
  async setMuutoshakemusSisaltoDecision(status: PaatosStatus) {
    await this.page.click(`label[for="haen-sisaltomuutosta-${status}"]`)
  }

  /** @deprecated use MuutoshakemusTab */
  async fillMuutoshakemusBudgetAmount(budget: BudgetAmount) {
    await this.page.fill(
      "input[name='talousarvio.personnel-costs-row'][type='number']",
      budget.personnel
    )
    await this.page.fill(
      "input[name='talousarvio.material-costs-row'][type='number']",
      budget.material
    )
    await this.page.fill(
      "input[name='talousarvio.equipment-costs-row'][type='number']",
      budget.equipment
    )
    await this.page.fill(
      "input[name='talousarvio.service-purchase-costs-row'][type='number']",
      budget['service-purchase']
    )
    await this.page.fill("input[name='talousarvio.rent-costs-row'][type='number']", budget.rent)
    await this.page.fill(
      "input[name='talousarvio.steamship-costs-row'][type='number']",
      budget.steamship
    )
    await this.page.fill("input[name='talousarvio.other-costs-row'][type='number']", budget.other)
  }

  /** @deprecated use MuutoshakemusTab */
  async setMuutoshakemusBudgetDecision(status: PaatosStatus, value?: BudgetAmount) {
    if (status) {
      await this.page.click(`label[for="talousarvio-${status}"]`)
    }
    if (value) {
      await this.fillMuutoshakemusBudgetAmount(value)
    }
  }

  /** @deprecated use MuutoshakemusTab */
  async saveMuutoshakemus() {
    await this.page.click('[data-test-id="muutoshakemus-submit"]') // TODO: replace test id with button text
    await this.page.waitForSelector('[data-test-id="muutoshakemus-paatos"]')
    const statusText = await this.page.textContent('[data-test-id="paatos-status-text"]')
    expect(statusText).toEqual('Käsitelty')
  }

  async setSelectionCriteriaStars(questionNumber: number, starValue: number) {
    await this.page.click(
      `.valintaperuste-list tr.single-valintaperuste:nth-of-type(${questionNumber}) img:nth-of-type(${starValue})`
    )
  }

  async getHakemusScore(hakemusId: number): Promise<string | undefined> {
    const title = await this.page
      .locator(`[data-test-id=hakemus-scoring-${hakemusId}]`)
      .getAttribute('title')
    const regex = title?.match(/.*Keskiarvo\: ([\S]+).*/)
    return regex?.[1]
  }

  async sortBy(sortKey: string) {
    await this.page.click(`[data-test-id="sort-button-${sortKey}"]`)
  }

  tabs() {
    return {
      seuranta: this.page.locator('a:text-is("Seuranta")'),
      muutoshakemus: this.page.locator('a:has-text("Muutoshakemukset")'),
    }
  }

  async allowExternalApi(allow: boolean) {
    await this.tabs().seuranta.click()
    await this.page.click(`[data-test-id="set-allow-visibility-in-external-system-${allow}"]`)
    await this.waitForSave()
  }

  async clickRajaaListaaFilter(category: string, answer: string) {
    await this.page.click('[data-test-id="rajaa-listaa"]')
    const question = this.page.locator(`div:text-matches("${category}", "i")`)
    await question.click()
    await this.page.click(`button:text-matches("${answer}", "i")`)
    await question.click()
    await this.page.click('[data-test-id="rajaa-listaa-close"]')
  }

  getNormalizedBudget() {
    const rowLocator = (key: keyof BudgetAmount) =>
      this.page.locator(`#budget-edit-${key}-costs-row`)
    const getHaettuAmount = (key: keyof BudgetAmount) =>
      rowLocator(key).locator('.original-amount-column')
    const getMyonnettyAmount = (key: keyof BudgetAmount) =>
      rowLocator(key).locator('.amount-column').locator('input')

    const getBudget = (budgetType: 'haettu' | 'myonnetty'): Record<keyof BudgetAmount, Locator> => {
      const getValueFunction = budgetType === 'haettu' ? getHaettuAmount : getMyonnettyAmount
      return {
        'service-purchase': getValueFunction('service-purchase'),
        equipment: getValueFunction('equipment'),
        other: getValueFunction('other'),
        material: getValueFunction('material'),
        rent: getValueFunction('rent'),
        steamship: getValueFunction('steamship'),
        personnel: getValueFunction('personnel'),
      }
    }

    return {
      haettu: getBudget('haettu'),
      myonnetty: getBudget('myonnetty'),
    }
  }

  locators() {
    return {
      dropdown: this.page.getByTestId('avustushaku-dropdown'),
      poistaTilaRajaus: this.page.locator('[aria-label="Poista hakemuksen tila rajaukset"]'),
    }
  }

  sidebarLocators() {
    const oldAnswer = this.page.locator('.answer-old-value')
    const newAnswer = this.page.locator('.answer-new-value')
    const applicantName = '#applicant-name div'
    const phone = '#textField-0 div'
    const email = '#primary-email div'
    const trustedContactName = '#trusted-contact-name'
    const trustedContactEmail = '#trusted-contact-email'
    const trustedContactPhone = '#trusted-contact-phone'
    const koodisto = '#koodistoField-1'
    return {
      printableLink: this.page.locator('text="Tulostusversio"'),
      oldAnswers: {
        applicantName: oldAnswer.locator(applicantName),
        phoneNumber: oldAnswer.locator(phone),
        email: oldAnswer.locator(email),
        trustedContactName: oldAnswer.locator(trustedContactName),
        trustedContactEmail: oldAnswer.locator(trustedContactEmail),
        trustedContactPhone: oldAnswer.locator(trustedContactPhone),
        koodisto: oldAnswer.locator(koodisto),
      },
      newAnswers: {
        applicantName: newAnswer.locator(applicantName),
        phoneNumber: newAnswer.locator(phone),
        email: newAnswer.locator(email),
        trustedContactName: newAnswer.locator(trustedContactName),
        trustedContactEmail: newAnswer.locator(trustedContactEmail),
        trustedContactPhone: newAnswer.locator(trustedContactPhone),
        koodisto: newAnswer.locator(koodisto),
      },
      koodisto: this.page.locator(koodisto),
      trustedContact: {
        name: this.page.locator('#trusted-contact-name'),
        email: this.page.locator('#trusted-contact-email'),
        phoneNumber: this.page.locator('#trusted-contact-phone'),
      },
    }
  }

  arviointiTabLocators() {
    const arviointiTab = this.page.locator('#arviointi-tab')
    const budget = this.page.locator('#budget-edit-project-budget tfoot td').nth(2).locator('input')
    const traineeLocator = this.page.locator('#trainee-day-edit-trainee-day-summary tbody tr td')
    return {
      resendPaatokset: this.page.locator('text="Lähetä päätössähköposti uudestaan"'),
      paatoksetResent: this.page.locator('text="Sähköposti lähetetty"'),
      comments: {
        input: this.page.locator('#comment-input'),
        sendButton: this.page.locator('[data-test-id=send-comment]'),
        commentAdded: this.page.locator('text="Kommentti lisätty"'),
        comment: this.page.locator('.comment-list').locator('.single-comment').locator('div'),
      },
      taTili: createReactSelectLocators(arviointiTab, 'tatiliSelection'),
      projektikoodi: createReactSelectLocators(arviointiTab, 'code-value-dropdown-project-id'),
      budget,
      koulutusosio: {
        osioName: traineeLocator.nth(0),
        osio: {
          haettu: traineeLocator.nth(1),
          hyvaksyttyInput: traineeLocator
            .nth(2)
            .locator(
              `[id="trainee-day-edit-koulutusosiot.koulutusosio-1.koulutettavapaivat.scope"]`
            ),
          haettuOsallistujaMaara: traineeLocator.nth(3),
          hyvaksyttyOsallistujaMaaraInput: traineeLocator
            .nth(4)
            .locator(
              `[id="trainee-day-edit-koulutusosiot.koulutusosio-1.koulutettavapaivat.person-count"]`
            ),
        },
      },
    }
  }

  seurantaTabLocators() {
    return {
      grantedTotal: this.page.getByTestId('granted-total'),
      amountTotal: this.page.getByTestId('amount-total'),
      kustannusMyonnetty: this.page.locator(
        '#budget-edit-project-budget tfoot [class="granted-amount-column"] [class="money"]'
      ),
      kustannusHyvaksytty: this.page.locator(
        '#budget-edit-project-budget [class="amount-column"] [class="money sum"]'
      ),
      shouldPay: {
        truthy: this.page.locator('[for=set-should-pay-true]'),
        falsy: this.page.locator('[for=set-should-pay-false]'),
        comment: this.page.locator('#should-pay-comment'),
      },
      budjettimuutosTag: this.page
        .locator('[data-test-id=tags-container]')
        .locator('button:text-is("budjettimuutos")'),
    }
  }

  async getLataaExcel() {
    const downloadPromise = this.page.waitForEvent('download')
    await this.page.click('text=Lataa excel')
    const download = await downloadPromise
    const path = await download.path()
    if (!path) {
      throw new Error('no download path? wat?')
    }
    const workbook = xlsx.readFile(path)
    expect(workbook.SheetNames).toMatchObject([
      'Hakemukset',
      'Hakemuksien vastaukset',
      'Väliselvityksien vastaukset',
      'Loppuselvityksien vastaukset',
      'Tiliöinti',
    ])
    return workbook
  }

  async getArkistointitunnus() {
    return this.page.getByTestId('hakemus-arkistointitunnus').textContent()
  }
}
