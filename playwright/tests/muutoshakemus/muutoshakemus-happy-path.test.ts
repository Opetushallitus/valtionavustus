import { APIRequestContext, expect } from '@playwright/test'
import moment from 'moment'

import {
  Email,
  getAcceptedPäätösEmails,
  getLinkToHakemusFromSentEmails,
  getLinkToMuutoshakemusFromSentEmails,
  getMuutoshakemuksetKasittelemattaEmails,
  getValmistelijaEmails,
  lastOrFail,
  waitUntilMinEmails,
} from '../../utils/emails'
import { waitForNewTab } from '../../utils/util'
import { HAKIJA_URL, TEST_Y_TUNNUS, VIRKAILIJA_URL } from '../../utils/constants'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { MuutoshakemusValues } from '../../utils/types'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { randomString } from '../../utils/random'
import * as xlsx from 'xlsx'

const sendMuutoshakemuksiaKasittelemattaNotifications = (request: APIRequestContext) =>
  request.post(`${VIRKAILIJA_URL}/api/test/send-muutoshakemuksia-kasittelematta-notifications`)

const muutoshakemus1: MuutoshakemusValues = {
  jatkoaika: moment(new Date()).add(2, 'months').add(1, 'days').locale('fi'),
  jatkoaikaPerustelu:
    'Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset',
}

test.setTimeout(180000)

const expectYhteyshenkiloColumns = (
  workbook: xlsx.WorkBook,
  {
    name,
    email,
    phone,
  }: {
    name: string
    email: string
    phone: string
  }
) => {
  const sheet = workbook.Sheets['Hakemuksien vastaukset']
  expect(sheet.L1.v).toEqual('Yhteyshenkilö')
  expect(sheet.L2.v).toEqual(name)
  expect(sheet.M1.v).toEqual('Sähköposti')
  expect(sheet.M2.v).toEqual(email)
  expect(sheet.N1.v).toEqual('Puhelinumero')
  expect(sheet.N2.v).toEqual(phone)
}

test('When muutoshakemus enabled haku has been published, a hakemus has been submitted, and päätös has been sent', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID, userKey },
  context,
  hakuProps,
  answers,
}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await test.step('expect excel to contain original info', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    const workbook = await hakemustenArviointiPage.getLataaExcel()
    expectYhteyshenkiloColumns(workbook, {
      name: answers.contactPersonName,
      email: answers.contactPersonEmail,
      phone: answers.contactPersonPhoneNumber,
    })
  })
  let hakemusRegisterNumber: string | undefined
  let linkToMuutoshakemus = ''
  await test.step('hakija gets an email with a link to muutoshakemus', async () => {
    linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(hakemusID)
    expect(linkToMuutoshakemus).toContain(
      `${HAKIJA_URL}/muutoshakemus?lang=fi&user-key=${userKey}&avustushaku-id=${avustushakuID}`
    )
  })

  await test.step('hakija gets the correct email content', async () => {
    const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
    emails.forEach((email) => {
      const emailContent = email.formatted
      expect(emailContent).toContain(`${HAKIJA_URL}/muutoshakemus`)
      expect(emailContent).toContain(
        'Pääsette tekemään muutoshakemuksen sekä muuttamaan yhteyshenkilöä ja hänen yhteystietojaan koko hankekauden ajan tästä linkistä'
      )
    })
  })

  const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
  await test.step('hakija sees correct content', async () => {
    const projectName = answers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to verify form display')
    }
    await hakijaMuutoshakemusPage.navigateWithLink(linkToMuutoshakemus)
    const locators = hakijaMuutoshakemusPage.locators()
    await expect(locators.avustushakuName).toHaveText(hakuProps.avustushakuName)
    await expect(locators.projectName).toHaveText(projectName)
    await expect(locators.contactPerson).toHaveValue(answers.contactPersonName)
    await expect(locators.contactPersonEmail).toHaveValue(answers.contactPersonEmail)
    await expect(locators.contactPersonPhoneNumber).toHaveValue(answers.contactPersonPhoneNumber)
    await expect(locators.sendMuutospyyntoButton).toBeDisabled()
    await expect(locators.originalHakemus.yTunnus).toHaveText(TEST_Y_TUNNUS)
    await expect(locators.originalHakemus.contactPersonName).toHaveText(answers.contactPersonName)
  })

  await test.step('allows virkailija to edit the original hakemus', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.clickHakemus(hakemusID)
    hakemusRegisterNumber = await page.locator('section.va-register-number span.value').innerText()
    await page.getByRole('button', { name: 'Muokkaa hakemusta' }).click()

    const [modificationPage] = await Promise.all([
      context.waitForEvent('page'),
      await page.getByRole('button', { name: 'Siirry muokkaamaan' }).click(),
    ])
    expect(modificationPage.url()).toContain(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=`
    )
    await modificationPage.close()
  })

  const newName = randomString()
  const newEmail = 'uusi.email@reaktor.com'
  const newPhone = '0901967632'
  await hakijaMuutoshakemusPage.navigateWithLink(linkToMuutoshakemus)
  const locators = hakijaMuutoshakemusPage.locators()
  await test.step('test form validation before submitting muutoshakemus #1', async () => {
    await locators.contactPerson.fill(newName)
    await locators.contactPersonEmail.fill('not-email')
    await locators.contactPersonPhoneNumber.fill(newPhone)
    await expect(locators.sendMuutospyyntoButton).toBeDisabled()
    await expect(locators.contactPersonEmail).toHaveClass(/error/)
    await locators.contactPersonEmail.fill(newEmail)
    await expect(locators.contactPersonEmail).not.toHaveClass(/error/)
    await expect(locators.sendMuutospyyntoButton).toBeEnabled()
  })
  await test.step('varayhteyshenkilö fields should not be shown (as its not in the form)', async () => {
    await expect(locators.trustedContact.name).toBeHidden()
    await expect(locators.trustedContact.email).toBeHidden()
    await expect(locators.trustedContact.phone).toBeHidden()
  })

  await test.step('submit muutoshakemus #1', async () => {
    const registerNumber = await page.locator('[data-test-id="register-number"]').innerText()
    expect(registerNumber).toEqual(hakemusRegisterNumber)

    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus1)
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
  })

  await test.step('valmistelija gets an email', async () => {
    await test.step('with correct title', async () => {
      const email = lastOrFail(await waitUntilMinEmails(getValmistelijaEmails, 1, hakemusID))
      expect(email['to-address']).toEqual(['santeri.horttanainen@reaktor.com'])
      const title = email.formatted.match(/Hanke:.*/)?.[0]
      expect(title).toContain(`${hakuProps.registerNumber} - ${answers.projectName}`)
    })

    await test.step('with correct avustushaku link', async () => {
      const linkToHakemus = await getLinkToHakemusFromSentEmails(hakemusID)
      expect(linkToHakemus).toEqual(
        `${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`
      )
    })
  })
  const ukotettuValmistelijaEmail = 'santeri.horttanainen@reaktor.com'
  await test.step('ukotettu valmistelija gets a reminder', async () => {
    const emailsBefore = await getMuutoshakemuksetKasittelemattaEmails(
      ukotettuValmistelijaEmail,
      avustushakuID
    )
    await sendMuutoshakemuksiaKasittelemattaNotifications(page.request)
    const emailsAfter = await getMuutoshakemuksetKasittelemattaEmails(
      ukotettuValmistelijaEmail,
      avustushakuID
    )
    const emailsAfterLength = emailsAfter.length
    expect(emailsAfterLength).toBeGreaterThan(emailsBefore.length)
    const email = lastOrFail(emailsAfter)
    expect(email.subject).toEqual('Käsittelemättömiä muutoshakemuksia')
    expect(email['to-address']).toEqual([ukotettuValmistelijaEmail])
    const expectedArviointiLink = `${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/`
    expect(email.formatted).toContain(`- Muutoshakemuksia 1 kpl: ${expectedArviointiLink}`)
    await page.goto(expectedArviointiLink)
  })

  await test.step('expect excel to new info', async () => {
    const workbook = await hakemustenArviointiPage.getLataaExcel()
    expectYhteyshenkiloColumns(workbook, {
      name: newName,
      email: newEmail,
      phone: newPhone,
    })
  })

  await test.step('Muutoshakemus status is Uusi', async () => {
    await expect(hakemustenArviointiPage.muutoshakemusStatusFieldContent()).toHaveText('Uusi')
  })

  await test.step('go to hakemus muutoshakemus tab', async () => {
    await hakemustenArviointiPage.clickHakemus(hakemusID)
    await hakemustenArviointiPage.clickMuutoshakemusTab()
  })

  await test.step('shows the number of pending muutoshakemus in red', async () => {
    const numOfMuutosHakemuksetElement = page.getByTestId('number-of-pending-muutoshakemukset')
    await expect(numOfMuutosHakemuksetElement).toHaveText('(1)')
    const color = await numOfMuutosHakemuksetElement.evaluate((e) => getComputedStyle(e).color)
    expect(color).toBe('rgb(255, 0, 0)') // red
  })

  await test.step('muutoshakemustab links to the muutoshakemus form', async () => {
    const newPagePromise = waitForNewTab(page)
    await hakemustenArviointiPage.page.click('[data-test-id="muutoshakemus-link"]')
    const muutoshakemusPage = await newPagePromise
    expect(muutoshakemusPage.url()).toContain(
      `${HAKIJA_URL}/muutoshakemus?lang=fi&user-key=${userKey}&avustushaku-id=${avustushakuID}`
    )
    await muutoshakemusPage.close()
  })
  const assertAnswerValues = async () => {
    const sidebarLocators = hakemustenArviointiPage.sidebarLocators()
    await expect(sidebarLocators.oldAnswers.applicantName).toHaveText('Erkki Esimerkki')
    await expect(sidebarLocators.newAnswers.applicantName).toHaveText(newName)
    await expect(sidebarLocators.oldAnswers.phoneNumber).toHaveText('666')
    await expect(sidebarLocators.newAnswers.phoneNumber).toHaveText(newPhone)
    await expect(sidebarLocators.oldAnswers.email).toHaveText('erkki.esimerkki@example.com')
    await expect(sidebarLocators.newAnswers.email).toHaveText(newEmail)
  }
  await test.step('Displays correct muutoshakemus values', async () => {
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus1)
    await assertAnswerValues()
  })

  await test.step('printable link shows correct values', async () => {
    const sidebarLocators = hakemustenArviointiPage.sidebarLocators()
    const [printablePage] = await Promise.all([
      context.waitForEvent('page'),
      sidebarLocators.printableLink.click(),
    ])
    await printablePage.waitForLoadState()
    await expect(printablePage.locator('#applicant-name')).toHaveText(newName)
    await expect(printablePage.locator('#primary-email')).toHaveText(newEmail)
    await expect(printablePage.locator('#textField-0')).toHaveText(newPhone)
    await printablePage.close()
  })

  await test.step('accept muutoshakemus', async () => {
    const isCurrentAvustushakuEmail = (e: Email) =>
      e.formatted.includes(`/avustushaku/${avustushakuID}/`)

    const muutoshakemusTab = await hakemustenArviointiPage.clickMuutoshakemusTab()
    await muutoshakemusTab.setMuutoshakemusJatkoaikaDecision('accepted')
    await muutoshakemusTab.selectVakioperusteluInFinnish()

    const emailsBefore = await getMuutoshakemuksetKasittelemattaEmails(
      ukotettuValmistelijaEmail,
      avustushakuID
    )
    const emailsBeforeWithCurrentAvustushaku = emailsBefore.filter(isCurrentAvustushakuEmail)
    await muutoshakemusTab.saveMuutoshakemus()

    await test.step('email is shown as sent after page reload', async () => {
      await page.reload()
      await expect(page.locator('data-test-id=päätös-email-status')).toHaveText(
        /Päätös lähetetty hakijalle/
      )
    })

    await test.step('ukotettu valmistelija no longer gets notification for this avustushaku', async () => {
      await sendMuutoshakemuksiaKasittelemattaNotifications(page.request)
      const emailsAfterSending = await getMuutoshakemuksetKasittelemattaEmails(
        ukotettuValmistelijaEmail,
        avustushakuID
      )
      const emailsAfterWithCurrentAvustushaku = emailsAfterSending.filter(isCurrentAvustushakuEmail)
      expect(emailsBeforeWithCurrentAvustushaku).toEqual(emailsAfterWithCurrentAvustushaku)
    })

    await test.step('Values are not overwritten after re-sending päätös', async () => {
      await hakemustenArviointiPage.page.click('text="Arviointi"')
      await hakemustenArviointiPage.page.on('dialog', async (dialog) => {
        await dialog.accept()
      })
      const arviointiTabLocators = hakemustenArviointiPage.arviointiTabLocators()
      await arviointiTabLocators.resendPaatokset.click()
      await arviointiTabLocators.paatoksetResent.waitFor()
      await hakemustenArviointiPage.page.reload()
      await assertAnswerValues()
    })
  })
})
