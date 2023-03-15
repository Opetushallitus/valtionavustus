import { expect } from '@playwright/test'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../pages/hakujen-hallinta/LoppuselvitysPage'

test('virkailija can see loppuselvitys answers', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
}) => {
  expect(loppuselvitysFormFilled)
  const loppuselvitysPage = LoppuselvitysPage(page)
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
  expect(await page.innerText('#preview-container-loppuselvitys #textArea-0')).toEqual('Yhteenveto')
  expect(await page.innerText('#preview-container-loppuselvitys #textArea-2')).toEqual('Työn jako')
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-description.project-description-1.goal"]'
    )
  ).toEqual('Tavoite')
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-description.project-description-1.activity"]'
    )
  ).toEqual('Toiminta')
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-description.project-description-1.result"]'
    )
  ).toEqual('Tulokset')
  expect(await page.innerText('#preview-container-loppuselvitys #textArea-1')).toEqual('Arviointi')
  expect(await page.innerText('#preview-container-loppuselvitys #textArea-3')).toEqual('Tiedotus')

  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-outcomes.project-outcomes-1.outcome-type"]'
    )
  ).toEqual('Toimintamalli')
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-outcomes.project-outcomes-1.description"]'
    )
  ).toEqual('Kuvaus')
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-outcomes.project-outcomes-1.address"]'
    )
  ).toEqual('Saatavuustiedot')

  expect(
    await page.innerText('#preview-container-loppuselvitys #radioButton-good-practices')
  ).toEqual('Ei')
  expect(await page.innerText('#preview-container-loppuselvitys #textArea-4')).toEqual(
    'Lisätietoja'
  )
})
