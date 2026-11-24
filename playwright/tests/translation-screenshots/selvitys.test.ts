import { expect, Page } from '@playwright/test'
import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { HakijaSelvitysPage } from '../../pages/hakija/hakijaSelvitysPage'
import { ValiselvitysPage } from '../../pages/virkailija/hakujen-hallinta/ValiselvitysPage'
import { LoppuselvitysPage } from '../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { navigate } from '../../utils/navigate'
import {
  fiText,
  shootTranslation,
  writeTranslationManifest,
} from '../../utils/translationScreenshots'

// emails and virkailija-only status labels: no hakija UI to screenshot
const nullKeys = [
  'selvitys.status.missing',
  'selvitys.status.submitted',
  'selvitys.status.accepted',
  'loppuselvitys.status.missing',
  'loppuselvitys.status.submitted',
  'loppuselvitys.status.information_verified',
  'loppuselvitys.status.accepted',
  'loppuselvitys.asiatarkastus.subject',
  'loppuselvitys.asiatarkastus.content',
  'loppuselvitys.asiatarkastus.header',
  'loppuselvitys.asiatarkastus.footer',
  'muistutusviesti.header',
  'muistutusviesti.subject',
  'muistutusviesti.content',
  'muistutusviesti.footer',
  'selvitys-email.valiselvitys-default-message',
  'selvitys-email.default-subject',
  'selvitys-email.valiselvitys',
  'selvitys-email.loppuselvitys',
]

const waitForPendingChangesSaved = (page: Page) =>
  page.waitForFunction(() => document.getElementById('pending-changes')?.textContent === 'false')

test.setTimeout(240_000)

test('translation screenshots: hakija väliselvitys and loppuselvitys forms', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  väliselvityspyyntöSent,
  loppuselvityspyyntöSent,
}) => {
  expect(väliselvityspyyntöSent).toBeDefined()
  expect(loppuselvityspyyntöSent).toBeDefined()
  const manifest: Record<string, string | null> = {}
  const hakija = HakijaSelvitysPage(page)
  const shoot = async (key: string, text = fiText(key)) => {
    if (text) manifest[key] ??= await shootTranslation(page, key, text)
  }

  const shootDraftAndSubmitted = async (
    type: 'valiselvitys' | 'loppuselvitys',
    fill: () => Promise<void>
  ) => {
    // a saved draft (version > 1) shows the "not submitted" message
    await fill()
    await waitForPendingChangesSaved(page)
    await expect(page.locator('.not-sent-message')).toBeVisible()
    await shoot(`form.heading-${type}`)
    await shoot(`form.${type}-not-submitted`)
    // savehelp is a tooltip shown on hover of the submit button
    await page.locator('.form-control.soresu-tooltip').first().hover()
    await shoot(`form.savehelp-${type}`)

    await hakija.submitButton.click()
    // the click leaves the mouse over the button, which would show the savehelp tooltip in the shot
    await page.mouse.move(0, 0)
    await expect(hakija.submitButton).toHaveText(fiText(`form.submitted-${type}`)!)
    await shoot(`form.submitted-${type}`)
  }

  await test.step('väliselvitys', async () => {
    const valiselvitysPage = ValiselvitysPage(page)
    await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, hakemusID)
    const formUrl = await valiselvitysPage.linkToHakemus.getAttribute('href')
    if (!formUrl) throw Error('valiselvitys form url not found')
    await navigate(page, formUrl)
    await shootDraftAndSubmitted('valiselvitys', hakija.fillCommonValiselvitysForm)

    // accepting the väliselvitys makes the form non-updatable, which shows the expired message
    await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, hakemusID)
    await valiselvitysPage.acceptSelvitys()
    await navigate(page, formUrl)
    await expect(hakija.valiselvitysWarning).toBeVisible()
    // fiText cuts form-is-expired to '' since it starts with {{formtype}}; form-middle is rendered inside it
    await shoot('form.form-is-expired', 'Väliselvityksen jättämisen määräaika on umpeutunut')
    manifest['form.form-middle'] = manifest['form.form-is-expired']
  })

  await test.step('loppuselvitys', async () => {
    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    const formUrl = await loppuselvitysPage.getSelvitysFormUrl()
    await navigate(page, formUrl)
    await shootDraftAndSubmitted('loppuselvitys', hakija.fillCommonLoppuselvitysForm)

    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    await loppuselvitysPage.asiatarkastaLoppuselvitys('Ok')
    await navigate(page, formUrl)
    await expect(hakija.loppuselvitysWarning).toBeVisible()
    await shoot('form.form-final', 'Loppuselvityksen jättämisen määräaika on umpeutunut')
  })

  for (const key of [
    'form.heading-valiselvitys',
    'form.heading-loppuselvitys',
    'form.savehelp-valiselvitys',
    'form.savehelp-loppuselvitys',
    'form.submitted-valiselvitys',
    'form.submitted-loppuselvitys',
    'form.valiselvitys-not-submitted',
    'form.loppuselvitys-not-submitted',
    'form.form-is-expired',
    'form.form-final',
    'form.form-middle',
    ...nullKeys,
  ])
    manifest[key] ??= null
  writeTranslationManifest('selvitys', manifest)
})
