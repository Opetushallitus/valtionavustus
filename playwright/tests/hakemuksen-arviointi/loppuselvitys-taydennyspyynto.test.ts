import { expect } from '@playwright/test'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import {
  getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails,
  getLoppuselvitysTaydennyspyyntoTaloustarkastusEmails,
} from '../../utils/emails'

test('can send taydennyspyynto for loppuselvitys', async ({
  page,
  acceptedHakemus: { hakemusID },
  avustushakuID,
  loppuselvitysSubmitted: {},
}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  const loppuselvitysPage = await hakemustenArviointiPage.navigateToHakemusArviointiLoppuselvitys(
    avustushakuID,
    hakemusID
  )
  const emails = await getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails(hakemusID)
  expect(emails).toHaveLength(0)
  await test.step('only asiatarkastus is enabled', async () => {
    await expect(loppuselvitysPage.locators.asiatarkastus.taydennyspyynto).toBeEnabled()
    await expect(loppuselvitysPage.locators.taloustarkastus.taydennyspyynto).toBeDisabled()
  })
  await test.step('can send täydennyspyyntö email in asiatarkastus phase', async () => {
    const formHeading = page.getByRole('heading', { name: 'Asiatarkastuksen täydennyspyyntö' })
    await expect(formHeading).toBeHidden()
    await loppuselvitysPage.locators.asiatarkastus.taydennyspyynto.click()
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
    const emailsAfterSending = await getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails(hakemusID)
    expect(emailsAfterSending).toHaveLength(1)
  })
  await test.step('', async () => {
    await loppuselvitysPage.asiatarkastaLoppuselvitys('Ei huomioita')
    await expect(loppuselvitysPage.locators.asiatarkastus.taydennyspyynto).toBeDisabled()
    await expect(loppuselvitysPage.locators.taloustarkastus.taydennyspyynto).toBeEnabled()
    const emails = await getLoppuselvitysTaydennyspyyntoTaloustarkastusEmails(hakemusID)
    expect(emails).toHaveLength(0)
  })
  await test.step('can send täydennyspyyntö email in taloustarkastus phase', async () => {
    const formHeading = page.getByRole('heading', { name: 'Taloustarkastuksen täydennyspyyntö' })
    await expect(formHeading).toBeHidden()
    await loppuselvitysPage.locators.taloustarkastus.taydennyspyynto.click()
    await expect(formHeading).toBeVisible()
    const email1 = 'erkki.esimerkki@example.com'
    await expect(
      page.getByTestId('loppuselvitys-taydennyspyynto-taloustarkastus-receiver-0')
    ).toHaveValue(email1)
    const subject = 'Täydennyspyyntö koskien avustushaun budjettia'
    await page
      .getByTestId('loppuselvitys-taydennyspyynto-taloustarkastus-email-subject')
      .fill(subject)
    await page
      .getByTestId('loppuselvitys-taydennyspyynto-taloustarkastus-email-content')
      .fill('Tiedot ovat puuttelliset')
    await page.getByTestId('loppuselvitys-taydennyspyynto-taloustarkastus-submit').click()
    await expect(formHeading).toBeHidden()
    await page.getByTestId('open-email-0').nth(1).click()
    await expect(page.getByText(`Vastaanottajat${email1}`)).toBeVisible()
    await expect(page.getByText(`Aihe${subject}`)).toBeVisible()
    const emails = await getLoppuselvitysTaydennyspyyntoTaloustarkastusEmails(hakemusID)
    expect(emails).toHaveLength(1)
  })
})
