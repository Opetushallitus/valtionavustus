import { Page, expect } from '@playwright/test'
import { MuutoshakemusValues, PaatosStatus, PaatosValues } from '../../../utils/types'
import { BudgetAmount } from '../../../utils/budget'
import { getChangedBudgetTableCells, getExistingBudgetTableCells } from '../../../utils/util'

export type MuutoshakemusTab = ReturnType<typeof createMuutoshakemusTab>

export function createMuutoshakemusTab(page: Page) {
  const locators = {
    hakijaPerustelut: page.getByTestId('muutoshakemus-reasoning-title'),
    paatosPerustelut: page.getByTestId('muutoshakemus-form-paatos-reason'),
    sisaltomuutosPerustelut: page.getByTestId('sisaltomuutos-perustelut'),
    oldBudgetTitle: page.getByTestId('budget-old-title'),
    currentBudgetTitle: page.getByTestId('budget-change-title'),
    jatkoaika: page.getByTestId('muutoshakemus-jatkoaika'),
    esikatselePaatos: page.getByText('Esikatsele päätösdokumentti'),
    hakemuksenSisalto: page.getByTestId('muutoshakemus-sisalto'),
    multipleMuutoshakemus: {
      tabN: (n: number) => page.getByTestId(`muutoshakemus-tab-${n}`),
    },
    submit: page.getByText('Tee päätös ja lähetä hakijalle'),
    muutoshakemusContent: page.locator('.muutoshakemus-paatos__content'),
  }

  async function openPaatosPreview() {
    await expect(locators.muutoshakemusContent).not.toBeVisible()
    await locators.esikatselePaatos.click()
    await expect(locators.muutoshakemusContent).toBeVisible()

    return {
      close: async () => {
        await expect(locators.muutoshakemusContent).toBeVisible()
        await page.getByText('Sulje').click()
        await expect(locators.muutoshakemusContent).not.toBeVisible()
      },
      title: page.locator('.hakemus-details-modal__title-row > span'),
      muutoshakemusPaatosTitle: page.getByTestId('muutoshakemus-paatos-title'),
      jatkoaikaPaatos: page.getByTestId('paatos-jatkoaika'),
      jatkoaikaValue: page.getByTestId('paattymispaiva-value'),
      sisaltoPaatos: page.getByTestId('paatos-sisaltomuutos'),
      talousarvioPaatos: page.getByTestId('paatos-talousarvio'),
      esittelija: page.getByTestId('paatos-esittelija'),
      lisatietoja: page.getByTestId('paatos-additional-info'),
      hyvaksyja: page.getByTestId('paatos-decider'),
      registerNumber: page.getByTestId('paatos-register-number'),
      projectName: page.getByTestId('paatos-project-name'),
      org: page.locator('h1.muutoshakemus-paatos__org'),
      perustelu: page.getByTestId('paatos-reason'),
      existingBudgetTableCells: () =>
        getExistingBudgetTableCells(
          page,
          '.muutoshakemus-paatos__content [data-test-id="meno-input-row"]'
        ),
      changedBudgetTableCells: () =>
        getChangedBudgetTableCells(
          page,
          '.muutoshakemus-paatos__content [data-test-id="meno-input-row"]'
        ),
    }
  }

  async function setMuutoshakemusJatkoaikaDecision(status: PaatosStatus, value?: string) {
    await page.click(`label[for="haen-kayttoajan-pidennysta-${status}"]`)
    if (value) {
      await page.fill('div.datepicker input', value)
    }
  }

  async function fillMuutoshakemusBudgetAmount(budget: BudgetAmount) {
    await page.fill(
      "input[name='talousarvio.personnel-costs-row'][type='number']",
      budget.personnel
    )
    await page.fill("input[name='talousarvio.material-costs-row'][type='number']", budget.material)
    await page.fill(
      "input[name='talousarvio.equipment-costs-row'][type='number']",
      budget.equipment
    )
    await page.fill(
      "input[name='talousarvio.service-purchase-costs-row'][type='number']",
      budget['service-purchase']
    )
    await page.fill("input[name='talousarvio.rent-costs-row'][type='number']", budget.rent)
    await page.fill(
      "input[name='talousarvio.steamship-costs-row'][type='number']",
      budget.steamship
    )
    await page.fill("input[name='talousarvio.other-costs-row'][type='number']", budget.other)
  }

  async function setMuutoshakemusBudgetDecision(status: PaatosStatus, value?: BudgetAmount) {
    if (status) {
      await page.click(`label[for="talousarvio-${status}"]`)
    }
    if (value) {
      await fillMuutoshakemusBudgetAmount(value)
    }
  }

  async function setMuutoshakemusSisaltoDecision(status: PaatosStatus) {
    await page.click(`label[for="haen-sisaltomuutosta-${status}"]`)
  }

  async function selectVakioperusteluInFinnish() {
    await page.getByText('Lisää vakioperustelu suomeksi').click()
  }

  async function getAcceptedBudgetInputAmounts(): Promise<{ name: string; value: string }[]> {
    const inputs = await page.$$(
      '[data-test-id="muutoshakemus-form"] [data-test-id="meno-input"] > input'
    )
    return Promise.all(
      inputs.map(async (elem) => {
        const name = (await elem.getAttribute('name'))?.replace('talousarvio.', '') || ''
        const value = await elem.inputValue()
        return { name, value }
      })
    )
  }

  async function validateMuutoshakemusValues(
    muutoshakemus: MuutoshakemusValues,
    paatos?: PaatosValues
  ) {
    await expect(locators.jatkoaika).toHaveText(muutoshakemus.jatkoaika!.format('DD.MM.YYYY'))
    await expect(page.getByTestId('muutoshakemus-jatkoaika-perustelu')).toHaveText(
      muutoshakemus.jatkoaikaPerustelu
    )

    if (paatos) {
      await expect(page.getByTestId('muutoshakemus-paatos')).toBeVisible()
      const form = await page.evaluate(
        (selector: string) => document.querySelectorAll(selector).length,
        '[data-test-id="muutoshakemus-form"]'
      )
      expect(form).toEqual(0)
      const muutospaatosLink = await page.textContent('a.muutoshakemus__paatos-link')
      expect(muutospaatosLink).toMatch(
        /https?:\/\/[^\/]+\/muutoshakemus\/paatos\?user-key=[a-f0-9]{64}/
      )
    } else {
      await expect(page.getByTestId('muutoshakemus-form')).toBeVisible()
    }
  }

  async function writePerustelu(text: string) {
    await page.fill('#reason', text)
  }

  async function saveMuutoshakemus() {
    await locators.submit.click()
    await expect(page.getByTestId('muutoshakemus-paatos')).toBeVisible()
    await expect(page.getByTestId('paatos-status-text')).toHaveText('Käsitelty')
  }

  return {
    locators,
    setMuutoshakemusJatkoaikaDecision,
    setMuutoshakemusBudgetDecision,
    setMuutoshakemusSisaltoDecision,
    getAcceptedBudgetInputAmounts,
    selectVakioperusteluInFinnish,
    validateMuutoshakemusValues,
    writePerustelu,
    openPaatosPreview,
    saveMuutoshakemus,
  }
}
