import { muutoshakemusTest } from '../fixtures/muutoshakemusTest'
import {
  getAcceptedPäätösEmails,
  getLoppuselvitysEmails,
  getTäydennyspyyntöEmails,
  getValiselvitysEmails,
  getLinkToMuutoshakemusFromSentEmails,
  lastOrFail,
  waitUntilMinEmails,
  Email,
} from '../utils/emails'
import { HAKIJA_URL } from '../utils/constants'
import { selectors, expect } from '@playwright/test'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaMuutoshakemusPage } from '../pages/hakija/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { PaatosPage } from '../pages/virkailija/hakujen-hallinta/PaatosPage'

selectors.setTestIdAttribute('data-test-id')

const contactPersonEmail = 'yrjo.yhteyshenkilo@example.com'
const newContactPersonEmail = 'uusi.yhteyshenkilo@example.com'

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

test('Täydennyspyyntö email', async ({
  closedAvustushaku,
  page,
  submittedHakemus: { userKey },
  answers,
  avustushakuName,
}, testInfo) => {
  const avustushakuID = closedAvustushaku.id
  testInfo.setTimeout(testInfo.timeout + 25_000)

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)

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
  expect(emails[0]['to-address']).toHaveLength(1)
  expect(emails[0]['to-address']).toContain(answers.contactPersonEmail)
  expect(emails[0]['bcc']).toStrictEqual('santeri.horttanainen@reaktor.com')
  expect(emails[0].cc).toHaveLength(3)
  expect(emails[0].cc).toStrictEqual([
    'akaan.kaupunki@akaa.fi',
    answers.signatories![0].email,
    answers.signatories![1].email,
  ])
  expect(emails[0].formatted).toEqual(
    `Valtionavustus: ${avustushakuName}

Täydennyspyyntö:
"${täydennyspyyntöText}"

Pääset täydentämään avustushakemusta tästä linkistä: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=${userKey}&lang=fi

Muokkaa vain pyydettyjä kohtia.

Lisätietoja voit kysyä sähköpostitse yhteyshenkilöltä santeri.horttanainen@reaktor.com

Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki
puhelin 029 533 1000
etunimi.sukunimi@oph.fi
`
  )
})

async function getLatestAcceptedPaatosEmailsForHakemus(hakemusID: number, nthSentEmail: number) {
  const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, nthSentEmail, hakemusID)
  expect(emails).toHaveLength(nthSentEmail)
  const email = lastOrFail(emails)

  return {
    'to-address': email['to-address'].sort(),
    'reply-to': email['reply-to'],
  }
}

const expectedSentToAddresses = [
  contactPersonEmail,
  signatories[0].email,
  signatories[1].email,
  'akaan.kaupunki@akaa.fi',
].sort()

test('sends emails to correct contact and hakemus emails', async ({
  page,
  acceptedHakemus: { hakemusID },
  avustushakuID,
}) => {
  const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(hakemusID)
  await test.step('sends päätös email', async () => {
    const email = await getLatestAcceptedPaatosEmailsForHakemus(hakemusID, 1)
    expect(email['to-address']).toEqual(expectedSentToAddresses)
    expect(email['reply-to']).toEqual(null)
    const sentEmailsList = await page.getByTestId('sent-emails')
    const sentEmails = await sentEmailsList.textContent()
    expect(sentEmails!.split(' ').sort()).toEqual(expectedSentToAddresses.sort())
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
        'akaan.kaupunki@akaa.fi',
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
    expect(email['to-address']).toEqual([newContactPersonEmail, 'akaan.kaupunki@akaa.fi'])
    expect(email.bcc).toBeNull()
    expect(email.cc).toStrictEqual([])
    await expectIsOphEmail(email)
  })
  await test.step('sends loppuselvitys email', async () => {
    const loppuselvitysTab = await hakujenHallintaPage.switchToLoppuselvitysTab()
    await loppuselvitysTab.sendSelvitysPyynnot(1)
    const emails = await waitUntilMinEmails(getLoppuselvitysEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    const email = lastOrFail(emails)
    expect(email['to-address']).toEqual([newContactPersonEmail, 'akaan.kaupunki@akaa.fi'])
    expect(email.bcc).toBeNull()
    expect(email.cc).toStrictEqual([])
    await expectIsOphEmail(email)
  })
})

export async function expectIsOphEmail(email: Email) {
  await test.step('email is from no-reply@valtionavustukset.oph.fi', async () => {
    expect(email['from-address']).toEqual('no-reply@valtionavustukset.oph.fi')
  })

  await test.step('email contains OPH signature', async () => {
    expect(email.formatted).toContain(
      'Opetushallitus\n' +
        'Hakaniemenranta 6\n' +
        'PL 380, 00531 Helsinki\n' +
        'puhelin 029 533 1000\n' +
        'etunimi.sukunimi@oph.fi'
    )
  })
}

export async function expectIsFinnishJotpaEmail(email: Email) {
  await test.step('email is from no-reply@valtionavustukset.oph.fi', async () => {
    expect(email['from-address']).toEqual('no-reply@jotpa.fi')
  })

  await test.step('email contains Jotpa signature', async () => {
    expect(email.formatted).toContain(
      'Jatkuvan oppimisen ja työllisyyden palvelukeskus\n' +
        'Hakaniemenranta 6\n' +
        'PL 380, 00531 Helsinki\n' +
        'puhelin 029 533 1000\n' +
        'etunimi.sukunimi@jotpa.fi'
    )
  })
}

export async function expectIsSwedishJotpaEmail(email: Email) {
  await test.step('email is from no-reply@valtionavustukset.oph.fi', async () => {
    expect(email['from-address']).toEqual('no-reply@jotpa.fi')
  })

  await test.step('email contains Jotpa signature', async () => {
    expect(email.formatted).toContain(
      'Servicecentret för kontinuerligt lärande och sysselsättning\n' +
        'Hagnäskajen 6\n' +
        'PB 380, 00531 Helsingfors\n' +
        'telefon 029 533 1000\n' +
        'fornamn.efternamn@jotpa.fi'
    )
  })
}
