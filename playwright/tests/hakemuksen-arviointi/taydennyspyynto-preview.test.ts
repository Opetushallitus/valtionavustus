import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'

import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import { clickElementWithText } from '../../utils/util'

test.setTimeout(180000)

test('Virkailija can preview täydennyspyyntö', async ({
  closedAvustushaku,
  page,
  submittedHakemus: { userKey },
  answers,
}, testInfo) => {
  expect(userKey).toBeDefined()
  const avustushakuID = closedAvustushaku.id
  testInfo.setTimeout(testInfo.timeout + 25_000)

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await hakemustenArviointiPage.navigate(avustushakuID)

  await Promise.all([page.waitForNavigation(), page.click(`text=${answers.projectName}`)])

  const täydennyspyyntöText = 'Jaahas miltäköhän tämä täydennyspyyntö mahtaa näyttää sähköpostissa?'
  await hakemustenArviointiPage.fillTäydennyspyyntöField(täydennyspyyntöText)
  await clickElementWithText(page, 'a', 'Esikatsele')

  expect(await page.textContent("[data-test-id='change-request-preview-subject']")).toStrictEqual(
    `Otsikko: Täydennyspyyntö avustushakemukseesi`
  )
  expect(await page.textContent("[data-test-id='change-request-preview-sender']")).toStrictEqual(
    `Lähettäjä: no-reply@csc.fi`
  )
  expect(await page.textContent("[data-test-id='change-request-preview-content']"))
    .toContain(`Täydennyspyyntö:
"${täydennyspyyntöText}"

Pääset täydentämään avustushakemusta tästä linkistä: [linkki hakemukseen]
Muokkaa vain pyydettyjä kohtia.

Lisätietoja voitte kysyä sähköpostitse osoitteesta valtionavustukset@oph.fi

Hausta vastaava valmistelija on mainittu hakutiedotteessa.

Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki

puhelin 029 533 1000
faksi 029 533 1035
etunimi.sukunimi@oph.fi
`)
})
