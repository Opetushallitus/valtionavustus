import { expect } from '@playwright/test'

import { muutoshakemusTest } from '../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { getAvustushautForYear, getHakemuksetForAvustushaku } from '../utils/external-api'

const nutshell = 'Projectin pähkinäkuori'

const test = muutoshakemusTest.extend({
  answers: ({ answers }, use) =>
    use({
      ...answers,
      hakemusFields: [{ fieldId: 'project-nutshell', answer: nutshell }],
    }),
  hakuProps: ({ hakuProps }, use) =>
    use({
      ...hakuProps,
      hakemusFields: [{ fieldId: 'project-nutshell', type: 'textField' }],
    }),
})

test('external api', async ({
  finalAvustushakuEndDate,
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
}) => {
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await test.step('returns avustushaku when external api is allowed', async () => {
    const avustushaut = await getAvustushautForYear(finalAvustushakuEndDate.get('year'))
    const avustushaku = avustushaut.find((a) => a.id === avustushakuID)
    expect(avustushaku).toBeDefined()
    expect(avustushaku?.['hankkeen-alkamispaiva']).toBe('1969-04-20')
    expect(avustushaku?.['hankkeen-paattymispaiva']).toBe('4200-04-20')
  })

  await test.step('does not return hakemus when external api is disallowed', async () => {
    const hakemukset = await getHakemuksetForAvustushaku(avustushakuID)
    const hakemus = hakemukset.find((h) => h.id === hakemusID)
    expect(hakemus).toBeUndefined()
  })

  await test.step('allow hakemus for external api', async () => {
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await hakemustenArviointiPage.allowExternalApi(true)
  })

  await test.step('returns hakemus when external api is allowed', async () => {
    const hakemukset = await getHakemuksetForAvustushaku(avustushakuID)
    const hakemus = hakemukset.find((h) => h.id === hakemusID)
    expect(hakemus).toEqual({
      'project-name': 'Rahassa kylpijät Ky Ay Oy',
      'project-begin': '13.03.1992',
      'organization-name': 'Akaan kaupunki',
      'grant-id': avustushakuID,
      partners: null,
      'costs-granted': 100000,
      'user-last-name': null,
      language: 'fi',
      id: hakemusID,
      nutshell: nutshell,
      'user-first-name': null,
      'budget-granted': 99999,
      'project-end': '13.03.2032',
    })
  })

  await test.step('disallow avustushaku from external api', async () => {
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.allowExternalApi(false)
  })

  await test.step('does not return avustushaku when external api is disallowed', async () => {
    const avustushaut = await getAvustushautForYear(finalAvustushakuEndDate.get('year'))
    const avustushaku = avustushaut.find((a) => a.id === avustushakuID)
    expect(avustushaku).toBeUndefined()
  })

  await test.step('does not return hakemuses when avustushaku is disallowed from external api', async () => {
    const hakemukset = await getHakemuksetForAvustushaku(avustushakuID)
    expect(hakemukset).toEqual([])
  })
})
