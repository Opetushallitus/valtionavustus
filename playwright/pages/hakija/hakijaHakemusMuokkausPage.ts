import { Page } from '@playwright/test'

export function HakijaHakemusMuokkausPage(page: Page, lang: 'fi' | 'sv') {
  const locatorsFi = {
    aloitaMuokkaus: page.getByRole('button', { name: 'Aloita yhteystietojen muokkaus' }),
    lopetaMuokkaus: page.getByRole('button', { name: 'Tallenna muutos ja lopeta muokkaus' }),
    hakija: {
      nimi: page.locator('#applicant-name'),
    },
  }
  const locatorsSv = {
    aloitaMuokkaus: page.getByRole('button', { name: 'Redigera kontaktuppgifterna' }),
    lopetaMuokkaus: page.getByRole('button', { name: 'Spara ändringen' }),
    hakija: {
      nimi: page.locator('#applicant-name'),
    },
  }

  const locators: typeof locatorsFi = lang === 'fi' ? locatorsFi : locatorsSv

  async function aloitaMuokkaus() {
    await locators.aloitaMuokkaus.click()
  }
  async function changeHakijaName(name: string) {
    await locators.hakija.nimi.fill(name)
  }
  async function lopetaMuokkaus() {
    await locators.lopetaMuokkaus.click()
  }
  async function changeHakijaNameToEtunimiTakanimi() {
    await aloitaMuokkaus()
    await changeHakijaName('Etunimi Takanimi')
    await lopetaMuokkaus()
  }

  return {
    aloitaMuokkaus,
    lopetaMuokkaus,
    changeHakijaName,
    changeHakijaNameToEtunimiTakanimi,
  }
}
