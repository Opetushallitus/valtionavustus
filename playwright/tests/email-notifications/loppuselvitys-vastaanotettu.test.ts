import { expect } from '@playwright/test'

import {
  getHakemusTokenAndRegisterNumber,
  getLoppuselvitysSubmittedNotificationEmails,
  lastOrFail,
  waitUntilMinEmails,
} from '../../utils/emails'
import { selvitysTest as test } from '../../fixtures/selvitysTest'

test('loppuselvitys submitted notification is sent', async ({
  page,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
}) => {
  expect(loppuselvitysFormFilled)
  const emails = await waitUntilMinEmails(getLoppuselvitysSubmittedNotificationEmails, 1, hakemusID)
  const email = lastOrFail(emails)
  expect(email['to-address']).toEqual(['erkki.esimerkki@example.com', 'hakija-1424884@oph.fi'])
  expect(email.subject).toEqual('Loppuselvityksenne on vastaanotettu')
  const { 'register-number': registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
  expect(email.formatted).toContain(`Hyvä vastaanottaja,

olemme vastaanottaneet loppuselvityksenne.

Rahassa kylpijät Ky Ay Oy
${registerNumber}
`)
  expect(email.formatted).toContain(`
Voitte muokata jo lähetettyä selvitystä alkuperäisessä selvityspyynnössä olevan lomakelinkin kautta selvityksen määräaikaan saakka. Tällöin selvitystä ei kuitenkaan enää lähetetä uudelleen käsiteltäväksi, vaan muokkausten tallentuminen varmistetaan lomakkeen yläreunan lokitietokentästä.

Lisätietoja saatte tarvittaessa avustuspäätöksessä mainitulta lisätietojen antajalta. Teknisissä ongelmissa auttaa: valtionavustukset@oph.fi

Kun selvitys on käsitelty, ilmoitetaan siitä sähköpostitse avustuksen saajan viralliseen sähköpostiosoitteeseen sekä yhteyshenkilölle.`)

  const previewUrl = email.formatted.match(/(https?:\/\/\S+)/gi)?.[0]
  if (!previewUrl) {
    throw new Error('No preview url found')
  }

  await page.goto(previewUrl)
  await expect(page.locator('div.soresu-preview > h1')).toContainText(
    'loppuselvitys submitted notification is sent'
  )
  await expect(page.locator('#textArea-0 > div')).toContainText('Yhteenveto')
  await expect(page.locator('#textArea-2 > div')).toContainText('Työn jako')
})
