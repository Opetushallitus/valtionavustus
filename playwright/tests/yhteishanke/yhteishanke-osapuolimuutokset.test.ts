import { expect } from '@playwright/test'

import {
  yhteishankeMuutoshakemusTest as test,
  yhteishankeInitialOrgs,
} from '../../fixtures/yhteishankeMuutoshakemusTest'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import {
  getAvustushakuEmails,
  getLinkToMuutoshakemusFromSentEmails,
  parseMuutoshakemusPaatosFromEmails,
} from '../../utils/emails'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { isSetupScenario, printSetupLinks } from '../../utils/setupLinks'
import { submitMuutoshakemusAndExpectSuccess } from '../../utils/yhteishanke'

test('yhteishanke osapuolimuutos updates recipients and applicant contact rows after accepted decision', async ({
  page,
  avustushakuID,
  avustushakuName,
  acceptedYhteishankeHakemus,
  ukotettuValmistelija,
}) => {
  const { hakemusID, registerNumber } = acceptedYhteishankeHakemus
  const updatedFirst = {
    contactPerson: 'Eka Paivitetty',
    email: 'eka.paivitetty@ensimmainen.fi',
  }
  const newSecond = {
    name: 'Kolmas Organisaatio Ry',
    contactPerson: 'Kolmas Henkilö',
    email: 'kolmas@kolmas.fi',
  }

  // `task setup:yhteishanke-muutoshakemus` — accepted yhteishanke with päätös sent (produced
  // by the fixture), muutoshakemus/osapuolimuutos form ready to test.
  if (isSetupScenario('yhteishanke-muutoshakemus')) {
    const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(hakemusID)
    printSetupLinks('yhteishanke-muutoshakemus', {
      'Muutoshakemus (hakija)': linkToMuutoshakemus,
      'Arviointi (virkailija)': `${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/hakemus/${hakemusID}/muutoshakemukset/`,
    })
    return
  }

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await test.step('verify yhteishanke paatos email body contains updated avustushaku label', async () => {
    let emails: Awaited<ReturnType<typeof getAvustushakuEmails>> = []
    await expect
      .poll(
        async () => {
          emails = await getAvustushakuEmails(avustushakuID, 'yhteishanke-paatos')
          return emails.length
        },
        { message: 'Waiting for yhteishanke paatos emails' }
      )
      .toBeGreaterThan(0)

    for (const email of emails) {
      expect(email.formatted).toContain(`Valtionavustushaku: ${avustushakuName}`)
    }
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
      .locator('#perustelut-yhteishankeOsapuoliPerustelut')
      .fill('Poistetaan yksi osapuoli ja lisätään uusi')

    await expect(page.locator('#send-muutospyynto-button')).toHaveText('Lähetä käsiteltäväksi')
    await submitMuutoshakemusAndExpectSuccess(page)
  })

  await test.step('accepted_with_changes is not available for yhteishanke osapuolimuutos', async () => {
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await expect(page.getByTestId('yhteishanke-osapuolimuutokset')).toBeVisible()

    // Hyväksytään and Hylätään should be visible
    await expect(
      page.locator('label[for="haen-yhteishanke-osapuolimuutosta-accepted"]')
    ).toBeVisible()
    await expect(
      page.locator('label[for="haen-yhteishanke-osapuolimuutosta-rejected"]')
    ).toBeVisible()
    // Hyväksytään muutettuna should NOT be visible
    await expect(
      page.locator('label[for="haen-yhteishanke-osapuolimuutosta-accepted_with_changes"]')
    ).toHaveCount(0)
  })

  await test.step('accept osapuolimuutos and verify changed values are shown in hakemus diff', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    // Verify org changes are displayed in the pending muutoshakemus form
    await expect(page.getByTestId('yhteishanke-osapuolimuutokset')).toBeVisible()
    // Check all columns for first org (existing org kept with updated contacts)
    await expect(page.getByTestId('yhteishanke-org-0')).toContainText(
      yhteishankeInitialOrgs.first.name
    )
    await expect(page.getByTestId('yhteishanke-org-0')).toContainText(updatedFirst.contactPerson)
    await expect(page.getByTestId('yhteishanke-org-0')).toContainText(updatedFirst.email)
    // Check all columns for second org (new org replacing removed one)
    await expect(page.getByTestId('yhteishanke-org-1')).toContainText(newSecond.name)
    await expect(page.getByTestId('yhteishanke-org-1')).toContainText(newSecond.contactPerson)
    await expect(page.getByTestId('yhteishanke-org-1')).toContainText(newSecond.email)

    await muutoshakemusTab.setMuutoshakemusYhteishankeOsapuoliDecision('accepted')
    await muutoshakemusTab.writePerustelu('Hyväksytään yhteishankkeen osapuolimuutos')
    await muutoshakemusTab.saveMuutoshakemus()

    await hakemustenArviointiPage.navigateToHakemusArviointi(avustushakuID, hakemusID)
    const sidebar = hakemustenArviointiPage.sidebarLocators()
    await expect(sidebar.oldAnswers.secondYhteishankeOrganizationContactPerson).toHaveText(
      yhteishankeInitialOrgs.second.contactPerson
    )
    await expect(sidebar.oldAnswers.secondYhteishankeOrganizationEmail).toHaveText(
      yhteishankeInitialOrgs.second.email
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
    expect(recipients).not.toContain(yhteishankeInitialOrgs.second.email)

    for (const email of relevantEmails) {
      expect(email['to-address']).toHaveLength(1)
      expect(email.formatted).toContain(`Valtionavustus: ${avustushakuName}`)
      expect(email.formatted).toContain(`Terveisin,`)
      expect(email.formatted).toContain(ukotettuValmistelija)
      expect(email['attachment-title']).toBe('Oikaisuvaatimusosoitus')
    }
  })

  await test.step('päätös document shows yhteishanke org changes section', async () => {
    const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
    if (!links.linkToMuutoshakemusPaatos) {
      throw Error('No linkToMuutoshakemusPaatos found')
    }
    await page.goto(links.linkToMuutoshakemusPaatos)

    // "Asia" section lists yhteishanke org change, not sisaltomuutos
    await expect(page.locator('[data-test-id="muutospaatos-asia-content"]')).toContainText(
      'Muutoshakemus yhteishankkeen osapuoliin.'
    )
    await expect(page.locator('[data-test-id="muutospaatos-asia-content"]')).not.toContainText(
      'hankesuunnitelman sisältöön tai toteutustapaan'
    )

    // Yhteishanke org changes table is visible with correct data
    const firstOrg = page.getByTestId('yhteishanke-org-0')
    await expect(firstOrg).toContainText(yhteishankeInitialOrgs.first.name)
    await expect(firstOrg).toContainText(updatedFirst.contactPerson)
    await expect(firstOrg).toContainText(updatedFirst.email)

    const secondOrg = page.getByTestId('yhteishanke-org-1')
    await expect(secondOrg).toContainText(newSecond.name)
    await expect(secondOrg).toContainText(newSecond.contactPerson)
    await expect(secondOrg).toContainText(newSecond.email)

    // Perustelut are shown
    await expect(page.getByTestId('yhteishanke-perustelut')).toContainText(
      'Poistetaan yksi osapuoli ja lisätään uusi'
    )

    // Decision status is shown
    await expect(page.getByTestId('paatos-yhteishanke-osapuoli-container')).toBeVisible()
  })

  await test.step('applicant sees updated organization rows in contact-details section automatically', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)

    await page.getByTestId('checkbox-update-yhteishanke-organizations').check()
    await expect(page.locator('[id="other-organizations.other-organizations-1.name"]')).toHaveValue(
      yhteishankeInitialOrgs.first.name
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
    await expect(firstOrg).toContainText(yhteishankeInitialOrgs.first.name)
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

test('sisaltomuutos and yhteishanke osapuolimuutos can be accepted and rejected independently', async ({
  page,
  avustushakuID,
  acceptedYhteishankeHakemus,
}) => {
  const { hakemusID } = acceptedYhteishankeHakemus
  const newSecond = {
    name: 'Kolmas Organisaatio Ry',
    contactPerson: 'Kolmas Henkilö',
    email: 'kolmas@kolmas.fi',
  }

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await test.step('applicant requests both a sisaltomuutos and an osapuolimuutos', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)

    await page.locator('#checkbox-haenSisaltomuutosta').check()
    await page.locator('#perustelut-sisaltomuutosPerustelut').fill('Muutetaan hankkeen sisältöä')

    await page.locator('#checkbox-haenYhteishankkeenOsapuolimuutosta').check()
    await page.getByTestId('remove-yhteishanke-organization-change-2').click()
    await page.getByTestId('add-yhteishanke-organization-change').click()
    await page.locator('#yhteishankkeen-osapuolimuutokset-2-name').fill(newSecond.name)
    await page
      .locator('#yhteishankkeen-osapuolimuutokset-2-contactperson')
      .fill(newSecond.contactPerson)
    await page.locator('#yhteishankkeen-osapuolimuutokset-2-email').fill(newSecond.email)
    await page
      .locator('#perustelut-yhteishankeOsapuoliPerustelut')
      .fill('Korvataan osapuoli uudella')

    await expect(page.locator('#send-muutospyynto-button')).toHaveText('Lähetä käsiteltäväksi')
    await submitMuutoshakemusAndExpectSuccess(page)
  })

  await test.step('accept sisaltomuutos but reject osapuolimuutos in the same paatos', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await expect(page.getByTestId('sisaltomuutos-perustelut')).toContainText(
      'Muutetaan hankkeen sisältöä'
    )
    await expect(page.getByTestId('yhteishanke-osapuolimuutokset')).toBeVisible()
    await expect(page.getByTestId('yhteishanke-osapuoli-perustelut')).toContainText(
      'Korvataan osapuoli uudella'
    )

    await muutoshakemusTab.setMuutoshakemusSisaltoDecision('accepted')
    await muutoshakemusTab.setMuutoshakemusYhteishankeOsapuoliDecision('rejected')
    await muutoshakemusTab.writePerustelu('Sisältömuutos hyväksytään, osapuolimuutos hylätään')
    await muutoshakemusTab.saveMuutoshakemus()
  })

  await test.step('paatos document shows both sections with independent statuses', async () => {
    const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
    if (!links.linkToMuutoshakemusPaatos) {
      throw Error('No linkToMuutoshakemusPaatos found')
    }
    await page.goto(links.linkToMuutoshakemusPaatos)

    await expect(page.getByTestId('paatos-sisaltomuutos-container')).toBeVisible()
    await expect(page.getByTestId('paatos-sisaltomuutos')).toContainText(
      'Hyväksytään haetut muutokset sisältöön ja toteutustapaan'
    )

    await expect(page.getByTestId('paatos-yhteishanke-osapuoli-container')).toBeVisible()
    await expect(page.getByTestId('paatos-yhteishanke-osapuoli')).toContainText(
      'Hylätään haetut muutokset yhteishankkeen osapuoliin'
    )
  })

  await test.step('rejected osapuolimuutos does not update applicant organization rows', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)

    await page.getByTestId('checkbox-update-yhteishanke-organizations').check()
    await expect(page.locator('[id="other-organizations.other-organizations-2.name"]')).toHaveValue(
      yhteishankeInitialOrgs.second.name
    )
    await expect(
      page.locator('[id="other-organizations.other-organizations-2.email"]')
    ).toHaveValue(yhteishankeInitialOrgs.second.email)
  })
})
