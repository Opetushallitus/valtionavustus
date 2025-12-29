import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'

import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { createJotpaCodes } from '../../fixtures/JotpaTest'

test.setTimeout(180000)

const täydennyspyyntöText = 'Jaahas miltäköhän tämä täydennyspyyntö mahtaa näyttää sähköpostissa?'

test('Virkailija can preview OPH täydennyspyyntö', async ({
  closedAvustushaku,
  page,
  submittedHakemus: { userKey },
  avustushakuName,
  answers,
}, testInfo) => {
  expect(userKey).toBeDefined()
  const avustushakuID = closedAvustushaku.id
  testInfo.setTimeout(testInfo.timeout + 25_000)

  const projectName = answers.projectName
  if (!projectName) {
    throw new Error('projectName must be set in order to select hakemus')
  }

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(projectName)
  await hakemustenArviointiPage.fillTäydennyspyyntöField(täydennyspyyntöText)
  await page.getByText('Esikatsele').click()

  expect(await page.textContent("[data-test-id='change-request-preview-subject']")).toStrictEqual(
    `Otsikko: Täydennyspyyntö avustushakemukseesi`
  )
  expect(await page.textContent("[data-test-id='change-request-preview-sender']")).toStrictEqual(
    `Lähettäjä: no-reply@localhost`
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

const jotpaPreviewTest = test.extend({
  codes: async ({ page }, use) => {
    const codes = await createJotpaCodes(page)
    await use(codes)
  },
})

jotpaPreviewTest(
  'Virkailija can preview JOTPA täydennyspyyntö',
  async (
    { closedAvustushaku, page, submittedHakemus: { userKey }, avustushakuName, answers },
    testInfo
  ) => {
    expect(userKey).toBeDefined()
    const avustushakuID = closedAvustushaku.id
    testInfo.setTimeout(testInfo.timeout + 25_000)

    const projectName = answers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to select hakemus')
    }

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectHakemusFromList(projectName)
    await hakemustenArviointiPage.fillTäydennyspyyntöField(täydennyspyyntöText)
    await page.getByText('Esikatsele').click()

    expect(await page.textContent("[data-test-id='change-request-preview-content']"))
      .toContain(`Valtionavustus: ${avustushakuName}

Täydennyspyyntö:
"${täydennyspyyntöText}"

Pääset täydentämään avustushakemusta tästä linkistä: [linkki hakemukseen]

Muokkaa vain pyydettyjä kohtia.

Lisätietoja voit kysyä sähköpostitse yhteyshenkilöltä santeri.horttanainen@reaktor.com


Jatkuvan oppimisen ja työllisyyden palvelukeskus
Hakaniemenranta 6
PL 380, 00531 Helsinki
puhelin 029 533 1000
etunimi.sukunimi@jotpa.fi
`)
  }
)
