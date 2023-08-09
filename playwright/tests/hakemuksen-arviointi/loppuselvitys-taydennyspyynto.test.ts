import { expect } from '@playwright/test'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import { getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails } from '../../utils/emails'

test('can send taydennyspyynto for loppuselvitys', async ({
  page,
  acceptedHakemus: { hakemusID },
  avustushakuID,
  loppuselvitysSubmitted: {},
}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigateToHakemusArviointiLoppuselvitys(avustushakuID, hakemusID)
  const emails = await getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails(hakemusID)
  expect(emails).toHaveLength(0)
  const taydennyspyynto = page.getByText('Täydennyspyyntö')
  await test.step('only asiatarkastus is enabled', async () => {
    await expect(taydennyspyynto.nth(0)).toBeEnabled()
    await expect(taydennyspyynto.nth(1)).toBeDisabled()
  })
  await test.step('can send täydennyspyyntö email', async () => {
    const formHeading = page.getByRole('heading', { name: 'Asiatarkastuksen täydennyspyyntö' })
    await expect(formHeading).toBeHidden()
    await taydennyspyynto.nth(0).click()
    await expect(formHeading).toBeVisible()
    const email1 = 'erkki.esimerkki@example.com'
    await expect(
      page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-receiver-0')
    ).toHaveValue(email1)
    await page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-add-receiver').click()
    const email2 = 'erkki.esimerkki2@example.com'
    await page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-receiver-1').fill(email2)
    const subject = 'Täydennyspyyntö avustushaulle'
    await page
      .getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-email-subject')
      .fill(subject)
    await page
      .getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-email-content')
      .fill('Tiedot ovat puuttelliset')
    await page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-submit').click()
    await expect(formHeading).toBeHidden()
    await page.getByTestId('open-email-0').click()
    await expect(page.getByText(`Vastaanottajat${email1}, ${email2}`)).toBeVisible()
    await expect(page.getByText(`Aihe${subject}`)).toBeVisible()
  })
  const emailsAfterSending = await getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails(hakemusID)
  expect(emailsAfterSending).toHaveLength(1)
})
