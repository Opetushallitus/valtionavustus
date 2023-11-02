import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'

import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'

test.setTimeout(180000)

test('Virkailija can preview täydennyspyyntö', async ({
  closedAvustushaku,
  page,
  submittedHakemus: { userKey },
  avustushakuName,
  answers,
}, testInfo) => {
  expect(userKey).toBeDefined()
  const avustushakuID = closedAvustushaku.id
  testInfo.setTimeout(testInfo.timeout + 25_000)

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)

  const täydennyspyyntöText = 'Jaahas miltäköhän tämä täydennyspyyntö mahtaa näyttää sähköpostissa?'
  await hakemustenArviointiPage.fillTäydennyspyyntöField(täydennyspyyntöText)
  await page.getByText('Esikatsele').click()

  expect(await page.textContent("[data-test-id='change-request-preview-subject']")).toStrictEqual(
    `Otsikko: Täydennyspyyntö avustushakemukseesi`
  )
  expect(await page.textContent("[data-test-id='change-request-preview-sender']")).toStrictEqual(
    `Lähettäjä: no-reply@csc.fi`
  )
  expect(await page.textContent("[data-test-id='change-request-preview-content']"))
    .toContain(`Valtionavustus: ${avustushakuName}

Täydennyspyyntö:
"${täydennyspyyntöText}"

Pääset täydentämään avustushakemusta tästä linkistä: [linkki hakemukseen]

Muokkaa vain pyydettyjä kohtia.

Lisätietoja voit kysyä sähköpostitse yhteyshenkilöltä santeri.horttanainen@reaktor.com

Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki
puhelin 029 533 1000
etunimi.sukunimi@oph.fi
`)
})
