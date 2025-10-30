import { Page } from '@playwright/test'

export function HakijaHakemusMuokkausPage(page: Page, lang: 'fi' | 'sv') {
  const locatorsFi = {
    aloitaMuokkaus: page.getByRole('button', { name: 'Aloita yhteystietojen muokkaus' }),
    lopetaMuokkaus: page.getByRole('button', { name: 'Tallenna muutokset' }),
    hakija: {
      nimi: page.getByRole('textbox', { name: 'Yhteyshenkilön nimi' }),
    },
  }
  const locatorsSv = {
    aloitaMuokkaus: page.getByRole('button', { name: 'Redigera kontaktuppgifterna' }),
    lopetaMuokkaus: page.getByRole('button', { name: 'Spara ändringarna' }),
    hakija: {
      nimi: page.getByRole('textbox', { name: 'Kontaktperson', exact: true }),
    },
  }

  const locators: typeof locatorsFi = lang === 'fi' ? locatorsFi : locatorsSv

  async function changeHakijaName(name: string) {
    await locators.hakija.nimi.fill(name)
  }
  async function lopetaMuokkaus() {
    await locators.lopetaMuokkaus.click()
  }
  async function changeHakijaNameToEtunimiTakanimi() {
    await changeHakijaName('Etunimi Takanimi')
    await lopetaMuokkaus()
  }

  return {
    lopetaMuokkaus,
    changeHakijaName,
    changeHakijaNameToEtunimiTakanimi,
  }
}
