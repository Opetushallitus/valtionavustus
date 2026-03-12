import { expect, Page } from '@playwright/test'
import moment from 'moment'

import { yhteishankeTest as test } from '../../fixtures/yhteishankeTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import { getAvustushakuEmails, getHakemusTokenAndRegisterNumber } from '../../utils/emails'

const otherOrganization = (page: Page, index: number) => {
  const indexStartsFromOne = index + 1
  const baseLocator = page.locator(`[id="other-organizations-${indexStartsFromOne}"]`)
  return {
    name: baseLocator.locator(
      `[id="other-organizations.other-organizations-${indexStartsFromOne}.name"]`
    ),
    contactPerson: baseLocator.locator(
      `[id="other-organizations.other-organizations-${indexStartsFromOne}.contactperson"]`
    ),
    email: baseLocator.locator(
      `[id="other-organizations.other-organizations-${indexStartsFromOne}.email"]`
    ),
  }
}

async function submitMuutoshakemusAndExpectSuccess(page: Page) {
  const submitMuutoshakemusResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && /\/api\/muutoshakemus\//.test(response.url())
  )
  await page.locator('#send-muutospyynto-button').click()
  const response = await submitMuutoshakemusResponse
  const responseText = await response.text()
  expect(
    response.ok(),
    `Muutoshakemus submit failed with ${response.status()}: ${responseText}`
  ).toBeTruthy()
}

test('yhteishanke osapuolimuutos updates recipients and applicant contact rows after accepted decision', async ({
  page,
  avustushakuID,
  submittedHakemusUrl,
  answers,
  projektikoodi,
  codes,
  ukotettuValmistelija,
}) => {
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  const first = otherOrganization(page, 0)
  const second = otherOrganization(page, 1)
  const initialSecond = {
    name: 'Toinen Organisaatio Oy',
    contactPerson: 'Toka Henkilö',
    email: 'toka@toinen.fi',
  }
  const updatedFirst = {
    contactPerson: 'Eka Paivitetty',
    email: 'eka.paivitetty@ensimmainen.fi',
  }
  const newSecond = {
    name: 'Kolmas Organisaatio Ry',
    contactPerson: 'Kolmas Henkilö',
    email: 'kolmas@kolmas.fi',
  }

  await test.step('create and submit an accepted yhteishanke hakemus with two organizations', async () => {
    await page.goto(submittedHakemusUrl)
    await page.locator("[for='combined-effort.radio.0']").click()
    await expect(first.name).toBeVisible()

    await first.name.fill('Ensimmäinen Organisaatio Oy')
    await first.contactPerson.fill('Eka Henkilö')
    await first.email.fill('eka@ensimmainen.fi')

    await expect(second.name).toBeEnabled()
    await second.name.fill(initialSecond.name)
    await second.contactPerson.fill(initialSecond.contactPerson)
    await second.email.fill(initialSecond.email)

    await page.locator("[id='project-costs-row.amount']").fill('20000')
    await page.locator("[for='type-of-organization.radio.0']").click()
    await page.locator("[id='signature']").fill('Erkki Esimerkki')
    await page.locator("[id='signature-email']").fill('erkki@example.com')
    await page.locator('#bank-iban').fill('FI95 6682 9530 0087 65')
    await page.locator('#bank-bic').fill('OKOYFIHH')

    await hakijaAvustusHakuPage.waitForEditSaved()
    await hakijaAvustusHakuPage.submitApplication()
  })

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  let hakemusID = 0
  let registerNumber = ''

  await test.step('accept hakemus and send paatos so muutoshakemus link is available', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.setEndDate(moment().subtract(1, 'year').format('D.M.YYYY H.mm'))

    await hakemustenArviointiPage.navigate(avustushakuID)
    const projectName = answers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to accept avustushaku')
    }
    hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
      avustushakuID,
      projectName,
      projektikoodi,
      codes,
    })

    await hakemustenArviointiPage.closeHakemusDetails()
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)

    const resolvedHaunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await resolvedHaunTiedotPage.resolveAvustushaku()

    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.sendPaatos()
    registerNumber = (await getHakemusTokenAndRegisterNumber(hakemusID))['register-number']
  })

  await test.step('submit osapuolimuutos that removes one organization and adds a new one', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)

    await page.getByTestId('checkbox-update-yhteishanke-organizations').check()
    await page
      .locator('[id="other-organizations.other-organizations-1.contactperson"]')
      .fill(updatedFirst.contactPerson)
    await page
      .locator('[id="other-organizations.other-organizations-1.email"]')
      .fill(updatedFirst.email)

    await page.locator('#checkbox-haenYhteishankkeenOsapuolimuutosta').check()
    await expect(page.locator('#yhteishankkeen-osapuolimuutokset-1-name')).toHaveAttribute(
      'readonly',
      ''
    )
    await expect(page.locator('#yhteishankkeen-osapuolimuutokset-2-name')).toHaveAttribute(
      'readonly',
      ''
    )

    await page.getByTestId('remove-yhteishanke-organization-change-2').click()
    await page.getByTestId('add-yhteishanke-organization-change').click()
    await page.locator('#yhteishankkeen-osapuolimuutokset-2-name').fill(newSecond.name)
    await page
      .locator('#yhteishankkeen-osapuolimuutokset-2-contactperson')
      .fill(newSecond.contactPerson)
    await page.locator('#yhteishankkeen-osapuolimuutokset-2-email').fill(newSecond.email)
    await page
      .locator('#perustelut-sisaltomuutosPerustelut')
      .fill('Poistetaan yksi osapuoli ja lisätään uusi')

    await expect(page.locator('#send-muutospyynto-button')).toHaveText('Lähetä käsiteltäväksi')
    await submitMuutoshakemusAndExpectSuccess(page)
  })

  await test.step('accept osapuolimuutos and verify changed values are shown in hakemus diff', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    // Verify org changes are displayed in the pending muutoshakemus form
    await expect(page.getByTestId('yhteishanke-osapuolimuutokset')).toBeVisible()
    // Check all columns for first org (existing org kept with updated contacts)
    await expect(page.getByTestId('yhteishanke-org-0')).toContainText('Ensimmäinen Organisaatio Oy')
    await expect(page.getByTestId('yhteishanke-org-0')).toContainText(updatedFirst.contactPerson)
    await expect(page.getByTestId('yhteishanke-org-0')).toContainText(updatedFirst.email)
    // Check all columns for second org (new org replacing removed one)
    await expect(page.getByTestId('yhteishanke-org-1')).toContainText(newSecond.name)
    await expect(page.getByTestId('yhteishanke-org-1')).toContainText(newSecond.contactPerson)
    await expect(page.getByTestId('yhteishanke-org-1')).toContainText(newSecond.email)

    await muutoshakemusTab.setMuutoshakemusSisaltoDecision('accepted')
    await muutoshakemusTab.writePerustelu('Hyväksytään yhteishankkeen osapuolimuutos')
    await muutoshakemusTab.saveMuutoshakemus()

    await hakemustenArviointiPage.navigateToHakemusArviointi(avustushakuID, hakemusID)
    const sidebar = hakemustenArviointiPage.sidebarLocators()
    await expect(sidebar.oldAnswers.secondYhteishankeOrganizationContactPerson).toHaveText(
      initialSecond.contactPerson
    )
    await expect(sidebar.oldAnswers.secondYhteishankeOrganizationEmail).toHaveText(
      initialSecond.email
    )
    await expect(sidebar.newAnswers.secondYhteishankeOrganizationContactPerson).toHaveText(
      newSecond.contactPerson
    )
    await expect(sidebar.newAnswers.secondYhteishankeOrganizationEmail).toHaveText(newSecond.email)
  })

  await test.step('verify muutoshakemus paatos email recipients use new organization list', async () => {
    let emails: Awaited<ReturnType<typeof getAvustushakuEmails>> = []
    await expect
      .poll(
        async () => {
          emails = await getAvustushakuEmails(avustushakuID, 'yhteishanke-muutoshakemus-paatos')
          return emails.length
        },
        { timeout: 30_000, message: 'Waiting for yhteishanke muutoshakemus paatos emails' }
      )
      .toBeGreaterThan(0)

    const subjectPart = `Automaattinen viesti: Yhteishankkeen ${registerNumber} muutoshakemus on käsitelty`
    const relevantEmails = emails.filter((email) => email.subject?.includes(subjectPart))
    expect(relevantEmails.length).toBeGreaterThan(0)

    const recipients = relevantEmails.flatMap((email) => email['to-address'])
    expect(recipients).toContain(updatedFirst.email)
    expect(recipients).toContain(newSecond.email)
    expect(recipients).not.toContain(initialSecond.email)

    for (const email of relevantEmails) {
      expect(email['to-address']).toHaveLength(1)
    }
  })

  await test.step('applicant sees updated organization rows in contact-details section automatically', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)

    await page.getByTestId('checkbox-update-yhteishanke-organizations').check()
    await expect(page.locator('[id="other-organizations.other-organizations-1.name"]')).toHaveValue(
      'Ensimmäinen Organisaatio Oy'
    )
    await expect(
      page.locator('[id="other-organizations.other-organizations-1.contactperson"]')
    ).toHaveValue(updatedFirst.contactPerson)
    await expect(
      page.locator('[id="other-organizations.other-organizations-1.email"]')
    ).toHaveValue(updatedFirst.email)
    await expect(page.locator('[id="other-organizations.other-organizations-2.name"]')).toHaveValue(
      newSecond.name
    )
    await expect(
      page.locator('[id="other-organizations.other-organizations-2.contactperson"]')
    ).toHaveValue(newSecond.contactPerson)
    await expect(
      page.locator('[id="other-organizations.other-organizations-2.email"]')
    ).toHaveValue(newSecond.email)
    await expect(page.locator('[id="other-organizations.other-organizations-3.name"]')).toHaveCount(
      0
    )
  })

  await test.step('hakija sees yhteishanke org changes in decided muutoshakemus', async () => {
    // Page is already on the muutoshakemus page from the previous step
    const orgChangesLocator = page.locator(
      '[data-test-class="existing-muutoshakemus"] [data-test-id="yhteishanke-osapuolimuutokset"]'
    )
    await expect(orgChangesLocator).toBeVisible()

    const firstOrg = page.locator(
      '[data-test-class="existing-muutoshakemus"] [data-test-id="yhteishanke-org-0"]'
    )
    await expect(firstOrg).toContainText('Ensimmäinen Organisaatio Oy')
    await expect(firstOrg).toContainText(updatedFirst.contactPerson)
    await expect(firstOrg).toContainText(updatedFirst.email)

    const secondOrg = page.locator(
      '[data-test-class="existing-muutoshakemus"] [data-test-id="yhteishanke-org-1"]'
    )
    await expect(secondOrg).toContainText(newSecond.name)
    await expect(secondOrg).toContainText(newSecond.contactPerson)
    await expect(secondOrg).toContainText(newSecond.email)
  })
})
