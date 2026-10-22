import { muutoshakemusTest } from '../fixtures/muutoshakemusTest'
import {
  getAcceptedPäätösEmails,
  getLoppuselvitysEmails,
  getTäydennyspyyntöEmails,
  getValiselvitysEmails,
  getLinkToMuutoshakemusFromSentEmails,
  lastOrFail,
  waitUntilMinEmails,
} from '../utils/emails'
import { HAKIJA_URL } from '../utils/constants'
import { selectors, expect } from '@playwright/test'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaMuutoshakemusPage } from '../pages/hakija/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { PaatosPage } from '../pages/virkailija/hakujen-hallinta/PaatosPage'
import { expectIsFinnishOphEmail } from '../utils/email-signature'

selectors.setTestIdAttribute('data-test-id')

const contactPersonEmail = 'yrjo.yhteyshenkilo@example.com'
const newContactPersonEmail = 'uusi.yhteyshenkilo@example.com'
const trustedContactEmail = 'vara.yhteyshenkilo@example.com'

const signatories = [
  {
    name: 'Kalevi Isohookana-Pikkugee',
    email: 'kalevi.isohookana-pikkugee@example.com',
  },
  {
    name: 'Väinö J. Karjalainen',
    email: 'vaino.j.karjalainen@example.com',
  },
]

const trustedContact = {
  name: 'Vara Yhteyshenkilö',
  email: trustedContactEmail,
  phone: '0509876543',
}

const test = muutoshakemusTest.extend({
  answers: async ({}, use) => {
    await use({
      contactPersonEmail,
      contactPersonName: 'Yrjö Yhteyshenkilö',
      contactPersonPhoneNumber: '0501234567',
      projectName: 'Hanke päätöksen uudelleenlähetyksen testaamiseksi',
      signatories,
    })
  },
})

const testWithTrustedContact = muutoshakemusTest.extend({
  answers: async ({}, use) => {
    await use({
      contactPersonEmail,
      contactPersonName: 'Yrjö Yhteyshenkilö',
      contactPersonPhoneNumber: '0501234567',
      projectName: 'Hanke täydennyspyynnön testaamiseksi varayhteyshenkilöllä',
      signatories,
      trustedContact,
    })
  },
})

test('Täydennyspyyntö email', async ({
  closedAvustushaku,
  page,
  submittedHakemus: { userKey },
  answers,
  avustushakuName,
}, testInfo) => {
  const avustushakuID = closedAvustushaku.id
  testInfo.setTimeout(testInfo.timeout + 25_000)

  const projectName = answers.projectName
  if (!projectName) {
    throw new Error('projectName must be set in order to select hakemus')
  }

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(projectName)

  const hakemusID = await hakemustenArviointiPage.getHakemusID()

  expect(await getTäydennyspyyntöEmails(hakemusID)).toHaveLength(0)

  const täydennyspyyntöText = 'Joo ei tosta hakemuksesta ota mitään tolkkua. Voisitko tarkentaa?'
  await hakemustenArviointiPage.fillTäydennyspyyntöField(täydennyspyyntöText)

  await hakemustenArviointiPage.clickToSendTäydennyspyyntö(avustushakuID, hakemusID)

  await expect(page.locator('#arviointi-tab .change-request-title')).toHaveText(
    /\* Täydennyspyyntö lähetetty \d{1,2}\.\d{1,2}\.\d{4} \d{1,2}\.\d{1,2}/
  )
  // The quotes around täydennyspyyntö message are done with CSS :before
  // and :after pseudo elements and not shown in Node.textContent
  await expect(page.locator('#arviointi-tab .change-request-text')).toHaveText(täydennyspyyntöText)

  const emails = await waitUntilMinEmails(getTäydennyspyyntöEmails, 1, hakemusID)
  expect(emails).toHaveLength(1)
  expect(emails[0]['to-address']).toHaveLength(2)
  expect(emails[0]['to-address']).toContain(answers.contactPersonEmail)
  expect(emails[0]['to-address']).toContain('hakija-1424884@oph.fi')
  expect(emails[0]['bcc']).toStrictEqual('santeri.horttanainen@reaktor.com')
  expect(emails[0].cc).toHaveLength(3)
  expect(emails[0].cc).toStrictEqual([
    'hakija-1424884@oph.fi',
    answers.signatories![0].email,
    answers.signatories![1].email,
  ])
  expect(emails[0].formatted).toContain(
    `Valtionavustus: ${avustushakuName}

Täydennyspyyntö:
"${täydennyspyyntöText}"

Pääset täydentämään avustushakemusta tästä linkistä: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=${userKey}&lang=fi

Muokkaa vain pyydettyjä kohtia.

Lisätietoja voit kysyä sähköpostitse yhteyshenkilöltä santeri.horttanainen@reaktor.com`
  )
  await expectIsFinnishOphEmail(emails[0])
})

testWithTrustedContact(
  'Täydennyspyyntö email includes trusted contact (varayhteyshenkilö)',
  async ({ closedAvustushaku, page, submittedHakemus: _submittedHakemus, answers }, testInfo) => {
    const avustushakuID = closedAvustushaku.id
    testInfo.setTimeout(testInfo.timeout + 25_000)

    const projectName = answers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to select hakemus')
    }

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)

    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectHakemusFromList(projectName)

    const hakemusID = await hakemustenArviointiPage.getHakemusID()

    expect(await getTäydennyspyyntöEmails(hakemusID)).toHaveLength(0)

    const täydennyspyyntöText = 'Täydennä hakemustasi, kiitos.'
    await hakemustenArviointiPage.fillTäydennyspyyntöField(täydennyspyyntöText)

    await hakemustenArviointiPage.clickToSendTäydennyspyyntö(avustushakuID, hakemusID)

    await expect(page.locator('#arviointi-tab .change-request-title')).toHaveText(
      /\* Täydennyspyyntö lähetetty \d{1,2}\.\d{1,2}\.\d{4} \d{1,2}\.\d{1,2}/
    )

    const emails = await waitUntilMinEmails(getTäydennyspyyntöEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    expect(emails[0]['to-address']).toHaveLength(2)
    expect(emails[0]['to-address']).toContain(answers.contactPersonEmail)
    expect(emails[0]['to-address']).toContain('hakija-1424884@oph.fi')
    expect(emails[0]['bcc']).toStrictEqual('santeri.horttanainen@reaktor.com')
    // CC should include: organization-email, 2 signatories, AND trusted-contact-email
    expect(emails[0].cc).toHaveLength(4)
    expect(emails[0].cc).toContain('hakija-1424884@oph.fi')
    expect(emails[0].cc).toContain(answers.signatories![0].email)
    expect(emails[0].cc).toContain(answers.signatories![1].email)
    expect(emails[0].cc).toContain(answers.trustedContact!.email)
    await expectIsFinnishOphEmail(emails[0])
  }
)

async function getLatestAcceptedPaatosEmailsForHakemus(hakemusID: number, nthSentEmail: number) {
  const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, nthSentEmail, hakemusID)
  expect(emails).toHaveLength(nthSentEmail)
  const email = lastOrFail(emails)

  return {
    'to-address': email['to-address'].sort(),
    'reply-to': email['reply-to'],
    formatted: email.formatted,
  }
}

const expectedSentToAddresses = [
  contactPersonEmail,
  signatories[0].email,
  signatories[1].email,
  'hakija-1424884@oph.fi',
].sort()

test('sends emails to correct contact and hakemus emails', async ({
  page,
  acceptedHakemus: { hakemusID, userKey },
  avustushakuID,
  answers,
  avustushakuName,
  ukotettuValmistelija,
}) => {
  const yhteystiedotUrl = `${HAKIJA_URL}/avustushaku/${avustushakuID}/hakemus/${userKey}/yhteystiedot`
  const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(hakemusID)
  await test.step('sends päätös email', async () => {
    const email = await getLatestAcceptedPaatosEmailsForHakemus(hakemusID, 1)
    expect(email['to-address']).toEqual(expectedSentToAddresses)
    expect(email['reply-to']).toEqual(null)
    expect(email.formatted).toContain(
      `Ajantasaiset yhteystiedot hakemuksenne käsittelijään löydätte tästä linkistä: ${yhteystiedotUrl}?lang=fi`
    )
    const sentEmailsList = await page.getByTestId('sent-emails')
    const sentEmails = await sentEmailsList.textContent()
    expect(sentEmails!.split(' ').sort()).toEqual(expectedSentToAddresses.sort())
  })
  await test.step('päätös email preview contains yhteystiedot link', async () => {
    await PaatosPage(page).navigateTo(avustushakuID)
    await expect(page.locator('.decision-email-content')).toContainText(
      `Ajantasaiset yhteystiedot hakemuksenne käsittelijään löydätte tästä linkistä: ${yhteystiedotUrl}?lang=fi`
    )
  })
  const yhteystiedotContact = page.getByTestId('yhteystiedot-contact')
  await test.step('yhteystiedot link shows hakemus and ukotettu valmistelija', async () => {
    await page.goto(`${yhteystiedotUrl}?lang=fi`)
    await expect(page.getByTestId('yhteystiedot-hanke')).toHaveText(answers.projectName ?? '')
    await expect(page.getByTestId('yhteystiedot-haku')).toHaveText(avustushakuName)
    await expect(page.getByTestId('yhteystiedot-hakemusnumero')).not.toBeEmpty()
    await expect(
      page.getByRole('heading', { name: 'Lisätietoja hakemuksestanne antaa' })
    ).toBeVisible()
    await expect(yhteystiedotContact).toContainText(ukotettuValmistelija)
  })
  await test.step('yhteystiedot switches language without reloading', async () => {
    let yhteystiedotRequests = 0
    page.on('request', (request) => {
      if (request.url().includes('/yhteystiedot') && request.url().includes('/api/')) {
        yhteystiedotRequests++
      }
    })
    await page.getByRole('link', { name: 'På svenska' }).click()
    await expect(
      page.getByRole('heading', { name: 'Lisätietoja hakemuksestanne antaa (SV)' })
    ).toBeVisible()
    await expect(page).toHaveURL(/\?lang=sv$/)
    await expect(yhteystiedotContact).toContainText(ukotettuValmistelija)
    expect(yhteystiedotRequests).toBe(0)
  })
  await test.step('yhteystiedot shows the new valmistelija after re-ukotus', async () => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID, { showAll: true })
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, 'Viivi Virkailija')
    await page.goto(yhteystiedotUrl)
    await expect(yhteystiedotContact).toContainText('Viivi Virkailija')
    await expect(yhteystiedotContact).not.toContainText(ukotettuValmistelija)
  })
  await test.step('yhteystiedot shows no contact for an unknown hakemus', async () => {
    await page.goto(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/hakemus/tuntematon-user-key/yhteystiedot`
    )
    await expect(page.getByText('Hakemusta ei löytynyt.')).toBeVisible()
    await expect(yhteystiedotContact).toBeHidden()
  })
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const paatosPage = PaatosPage(page)
  await paatosPage.navigateTo(avustushakuID)

  await test.step('resends päätös', async () => {
    await paatosPage.resendPaatokset(1)

    const email = await getLatestAcceptedPaatosEmailsForHakemus(hakemusID, 2)
    expect(email['to-address']).toEqual(expectedSentToAddresses)
    expect(email['reply-to']).toEqual(null)
  })
  const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
  await test.step('resends to correct address after changing contact person email', async () => {
    await hakijaMuutoshakemusPage.navigateWithLink(linkToMuutoshakemus)
    await hakijaMuutoshakemusPage.changeContactPersonEmailTo(newContactPersonEmail)
    await hakijaMuutoshakemusPage.clickSaveContacts()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(false)
    expect(await getValiselvitysEmails(hakemusID)).toHaveLength(0)
    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.resendPaatokset()

    const email = await getLatestAcceptedPaatosEmailsForHakemus(hakemusID, 3)
    expect(email['to-address']).toEqual(
      [
        newContactPersonEmail,
        signatories[0].email,
        signatories[1].email,
        'hakija-1424884@oph.fi',
      ].sort()
    )
  })

  await test.step('sends väliselvitys email', async () => {
    const valiselvitysPage =
      await hakujenHallintaPage.commonHakujenHallinta.switchToValiselvitysTab()
    await valiselvitysPage.sendValiselvitys(1)
    const emails = await waitUntilMinEmails(getValiselvitysEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    const email = lastOrFail(emails)
    expect(email['to-address']).toEqual([newContactPersonEmail, 'hakija-1424884@oph.fi'])
    expect(email.bcc).toBeNull()
    expect(email.cc).toStrictEqual([])
    await expectIsFinnishOphEmail(email)
  })
  await test.step('sends loppuselvitys email', async () => {
    const loppuselvitysTab = await hakujenHallintaPage.switchToLoppuselvitysTab()
    await loppuselvitysTab.sendSelvitysPyynnot(1)
    const emails = await waitUntilMinEmails(getLoppuselvitysEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    const email = lastOrFail(emails)
    expect(email['to-address']).toEqual([newContactPersonEmail, 'hakija-1424884@oph.fi'])
    expect(email.bcc).toBeNull()
    expect(email.cc).toStrictEqual([])
    await expectIsFinnishOphEmail(email)
  })
})
