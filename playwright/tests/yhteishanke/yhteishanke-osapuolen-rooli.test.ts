import { expect } from '@playwright/test'

import {
  yhteishankeMuutoshakemusTest as test,
  yhteishankeInitialOrgs,
} from '../../fixtures/yhteishankeMuutoshakemusTest'
import { avustushakuWithOrganizationRoleHakulomake } from '../../fixtures/avustushakuWithOrganizationRole'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { parseMuutoshakemusPaatosFromEmails } from '../../utils/emails'
import { submitMuutoshakemusAndExpectSuccess } from '../../utils/yhteishanke'
import { getHakemusAnswerByHeader } from '../../utils/excel'

test.use({ yhteishankeHakulomake: avustushakuWithOrganizationRoleHakulomake() })

const roleAnswerId = (indexStartsFromOne: number) =>
  `[id="other-organizations.other-organizations-${indexStartsFromOne}.role"] div`

test('yhteishanke osapuolen rooli seuraa osapuolta muutoshakemuksessa', async ({
  page,
  avustushakuID,
  acceptedYhteishankeHakemus,
}) => {
  const { hakemusID } = acceptedYhteishankeHakemus
  const updatedSecondRole = 'Toisen päivitetty rooli'
  const newThird = {
    name: 'Kolmas Testiorganisaatio Oy',
    contactPerson: 'Kolmas Testihenkilö',
    email: 'kolmas.testihenkilo@example.com',
    role: 'Kolmannen rooli',
  }
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await test.step('muutoshakemus form shows prefilled, editable role inputs', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await page.locator('#checkbox-haenYhteishankkeenOsapuolimuutosta').check()

    const firstRole = page.locator('#yhteishankkeen-osapuolimuutokset-1-role')
    const secondRole = page.locator('#yhteishankkeen-osapuolimuutokset-2-role')
    await expect(firstRole).toHaveValue(yhteishankeInitialOrgs.first.role)
    await expect(secondRole).toHaveValue(yhteishankeInitialOrgs.second.role)
    await expect(firstRole).toBeEditable()
    await expect(page.locator('#yhteishankkeen-osapuolimuutokset-1-name')).toHaveAttribute(
      'readonly',
      ''
    )
  })

  await test.step('contact-details-only update stays submittable when osapuolilla on rooli', async () => {
    // Temporarily close the osapuolimuutos section so this step isolates the contact-only
    // path (paivitanYhteishankkeenOsapuoltenYhteystietoja): with it open, the unrelated
    // required "yhteishankeOsapuoliPerustelut" field (filled later, in the next step) would
    // also keep the button disabled and mask the regression under test here.
    await page.locator('#checkbox-haenYhteishankkeenOsapuolimuutosta').uncheck()
    await page.getByTestId('checkbox-update-yhteishanke-organizations').check()
    await page
      .locator('[id="other-organizations.other-organizations-1.contactperson"]')
      .fill('Eka Päivitetty')
    await expect(page.locator('#send-muutospyynto-button')).toBeEnabled()
    await page.getByTestId('checkbox-update-yhteishanke-organizations').uncheck()
    await page.locator('#checkbox-haenYhteishankkeenOsapuolimuutosta').check()
  })

  await test.step('remove the first osapuoli, edit the remaining role and add a third osapuoli', async () => {
    await page.getByTestId('remove-yhteishanke-organization-change-1').click()
    await expect(page.locator('#yhteishankkeen-osapuolimuutokset-1-name')).toHaveValue(
      yhteishankeInitialOrgs.second.name
    )
    await expect(page.locator('#yhteishankkeen-osapuolimuutokset-1-role')).toHaveValue(
      yhteishankeInitialOrgs.second.role
    )
    await page.locator('#yhteishankkeen-osapuolimuutokset-1-role').fill(updatedSecondRole)

    await page.getByTestId('add-yhteishanke-organization-change').click()
    await page.locator('#yhteishankkeen-osapuolimuutokset-2-name').fill(newThird.name)
    await page
      .locator('#yhteishankkeen-osapuolimuutokset-2-contactperson')
      .fill(newThird.contactPerson)
    await page.locator('#yhteishankkeen-osapuolimuutokset-2-email').fill(newThird.email)
    await page.locator('#yhteishankkeen-osapuolimuutokset-2-role').fill(newThird.role)
    await page
      .locator('#perustelut-yhteishankeOsapuoliPerustelut')
      .fill('Poistetaan ensimmäinen osapuoli, päivitetään rooli ja lisätään uusi osapuoli')

    await submitMuutoshakemusAndExpectSuccess(page)
  })

  await test.step('virkailija sees the role column and accepts the muutoshakemus', async () => {
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    const table = page.getByTestId('yhteishanke-osapuolimuutokset')
    await expect(table).toContainText('Rooli hankkeessa')
    await expect(page.getByTestId('yhteishanke-org-0-role')).toHaveText(updatedSecondRole)
    await expect(page.getByTestId('yhteishanke-org-1-role')).toHaveText(newThird.role)

    await muutoshakemusTab.setMuutoshakemusYhteishankeOsapuoliDecision('accepted')
    await muutoshakemusTab.writePerustelu('Hyväksytään yhteishankkeen osapuolimuutos')
    await muutoshakemusTab.saveMuutoshakemus()
  })

  await test.step('hakemus diff shows the role following the osapuoli', async () => {
    await hakemustenArviointiPage.navigateToHakemusArviointi(avustushakuID, hakemusID)
    const oldAnswer = page.locator('.answer-old-value')
    const newAnswer = page.locator('.answer-new-value')

    await expect(oldAnswer.locator(roleAnswerId(1))).toHaveText(yhteishankeInitialOrgs.first.role)
    await expect(newAnswer.locator(roleAnswerId(1))).toHaveText(updatedSecondRole)
    await expect(oldAnswer.locator(roleAnswerId(2))).toHaveText(yhteishankeInitialOrgs.second.role)
    await expect(newAnswer.locator(roleAnswerId(2))).toHaveText(newThird.role)
  })

  await test.step('excel exports the roles in the accepted order', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    const workbook = await hakemustenArviointiPage.getLataaExcel()
    expect(getHakemusAnswerByHeader(workbook, 'Rooli hankkeessa 1')).toEqual(updatedSecondRole)
    expect(getHakemusAnswerByHeader(workbook, 'Rooli hankkeessa 2')).toEqual(newThird.role)
    expect(getHakemusAnswerByHeader(workbook, 'Yhteistyökumppanin nimi 2')).toEqual(newThird.name)
  })

  await test.step('päätös document shows the role column', async () => {
    const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
    if (!links.linkToMuutoshakemusPaatos) {
      throw Error('No linkToMuutoshakemusPaatos found')
    }
    await page.goto(links.linkToMuutoshakemusPaatos)
    await expect(page.getByTestId('yhteishanke-org-0-role')).toHaveText(updatedSecondRole)
    await expect(page.getByTestId('yhteishanke-org-1-role')).toHaveText(newThird.role)
  })

  await test.step('hakija sees the roles in the decided muutoshakemus', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    const existing = page.locator('[data-test-class="existing-muutoshakemus"]')
    await expect(existing.getByTestId('yhteishanke-org-0-role')).toHaveText(updatedSecondRole)
    await expect(existing.getByTestId('yhteishanke-org-1-role')).toHaveText(newThird.role)
  })
})
