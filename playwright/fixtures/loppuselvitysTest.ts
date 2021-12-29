import { expect } from "@playwright/test"

import { muutoshakemusTest} from "./muutoshakemusTest"
import { LoppuselvitysPage } from "../pages/loppuselvitysPage"
import { 
  clearAndType,
} from "../utils/util"
import {
  navigate
} from "../utils/navigate"
import {
  dummyPdfPath
} from "../utils/constants"

export interface LoppuselvitysFixtures {
  loppuselvitys: {
    loppuselvitysFormFilled: boolean
    loppuselvitysFormUrl: string
  }
  asiatarkastus: {
    asiatarkastettu: boolean
  }
}

export const loppuselvitysTest = muutoshakemusTest.extend<LoppuselvitysFixtures>({
  loppuselvitys: async ({page, avustushakuID, acceptedHakemus: {hakemusID}}, use) => {
    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    const loppuselvitysFormUrl = await page.getAttribute('[data-test-id="selvitys-link"]', 'href')
    if (!loppuselvitysFormUrl) {
      throw new Error('could not find loppuselvitys form url')
    }

    await navigate(page, loppuselvitysFormUrl)
    await page.waitForSelector('[id="textArea-0"]')

    await clearAndType(page, '[id="textArea-0"]', 'Yhteenveto')
    await clearAndType(page, '[id="textArea-2"]', 'Työn jako')
    await clearAndType(page, '[id="project-description.project-description-1.goal"]', 'Tavoite')
    await clearAndType(page, '[id="project-description.project-description-1.activity"]', 'Toiminta')
    await clearAndType(page, '[id="project-description.project-description-1.result"]', 'Tulokset')
    await clearAndType(page, '[id="textArea-1"]', 'Arviointi')
    await clearAndType(page, '[id="textArea-3"]', 'Tiedotus')

    await page.click('label[for="project-outcomes.project-outcomes-1.outcome-type.radio.0"]')
    await clearAndType(page, '[id="project-outcomes.project-outcomes-1.description"]', 'Kuvaus')
    await clearAndType(page, '[id="project-outcomes.project-outcomes-1.address"]', 'Saatavuustiedot')

    await page.click('label[for="radioButton-good-practices.radio.1"]')
    await clearAndType(page, '[id="textArea-4"]', 'Lisätietoja')

    await page.setInputFiles('[name="namedAttachment-0"]', dummyPdfPath)

    await page.click('button#submit:not([disabled])')
    
    await page.waitForSelector(`#submit:has-text("Loppuselvitys lähetetty")`)

    await use({
      loppuselvitysFormUrl,
      loppuselvitysFormFilled: true
    })
  },
  asiatarkastus: async ({page, avustushakuID, acceptedHakemus: {hakemusID}, loppuselvitys: {loppuselvitysFormFilled}}, use) => {
    expect(loppuselvitysFormFilled)
    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    const textareaSelector = 'textarea[name="information-verification"]'
    await clearAndType(page, textareaSelector, 'Hyvältä näyttääpi')
    await page.click('button[name="submit-verification"]')

    await page.waitForSelector('[data-test-id="taloustarkastus-email"]')
    await use ({
      asiatarkastettu: true
    })
  }
})
