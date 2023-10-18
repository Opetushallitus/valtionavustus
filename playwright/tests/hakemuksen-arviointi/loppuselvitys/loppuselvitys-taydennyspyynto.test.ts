import { expect } from '@playwright/test'

import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { HakemustenArviointiPage } from '../../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import {
  getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails,
  getLoppuselvitysTaydennyspyyntoTaloustarkastusEmails,
  getLoppuselvitysTaydennysReceivedHakijaNotificationEmails,
  getLoppuselvitysTaydennysReceivedEmails,
  getSelvitysEmails,
} from '../../../utils/emails'
import { HakijaSelvitysPage } from '../../../pages/hakija/hakijaSelvitysPage'
import { navigate } from '../../../utils/navigate'
import { VIRKAILIJA_URL } from '../../../utils/constants'

test('can send taydennyspyynto for loppuselvitys', async ({
  page,
  acceptedHakemus: { hakemusID },
  avustushakuID,
  avustushakuName,
  loppuselvitysSubmitted: { loppuselvitysFormUrl },
  hakuProps,
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
  const odottaaTaydennysta = page.getByTestId(`taydennyspyynto-odottaa-vastausta-${hakemusID}`)
  const taydennykseenVastattu = page.getByTestId(`taydennyspyyntoon-vastattu-${hakemusID}`)
  await test.step('no T-icon shown as no täydennys', async () => {
    await hakemustenArviointiPage.toggleHakemusList.click()
    await expect(odottaaTaydennysta).toBeHidden()
    await expect(taydennykseenVastattu).toBeHidden()
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
  await test.step('waiting T-icon as täydennys has been sent', async () => {
    await expect(odottaaTaydennysta).toBeVisible()
    await expect(loppuselvitysPage.locators.asiatarkastus.accept).toBeDisabled()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeDisabled()
    await expect(taydennykseenVastattu).toBeHidden()
  })
  const tavoiteLocator = page.locator('[id="project-description.project-description-1.goal"]')
  const defaultTavoite = 'Tavoite'
  const asiatarkastusTaydennysTavoite = 'Tavoite parannettu'
  const taloustarkastusTaydennysTavoite = 'Tavoite paras'
  const yhteenvetoLocator = page.locator('[id="textArea-0"]')
  const defaultYhteenveto = 'Yhteenveto'
  const asiatarkastusTaydennysYhteenveto = 'Yhteenveto parempi'
  const taloustarkastusTaydennysYhteenveto = 'Yhteenveto paras'
  const oldAnswer = hakemustenArviointiPage.page.locator('.answer-old-value')
  const newAnswer = hakemustenArviointiPage.page.locator('.answer-new-value')
  await test.step('hakija can send täydennys', async () => {
    expect(await getLoppuselvitysTaydennysReceivedEmails(hakemusID)).toHaveLength(0)
    await navigate(page, loppuselvitysFormUrl)
    const hakijaSelvitysPage = HakijaSelvitysPage(page)
    await expect(tavoiteLocator).toHaveValue(defaultTavoite)
    await expect(yhteenvetoLocator).toHaveValue(defaultYhteenveto)
    await tavoiteLocator.fill(asiatarkastusTaydennysTavoite)
    await yhteenvetoLocator.fill(asiatarkastusTaydennysYhteenveto)
    await hakijaSelvitysPage.taydennysButton.click()
    await expect(hakijaSelvitysPage.submitButton).toHaveText('Loppuselvitys lähetetty')
    await expect(tavoiteLocator).toHaveText(asiatarkastusTaydennysTavoite) // now span instead of input field
    await expect(yhteenvetoLocator).toHaveText(asiatarkastusTaydennysYhteenveto)
  })
  await test.step('virkailija receives täydennys received email after hakija submission', async () => {
    const emails = await getLoppuselvitysTaydennysReceivedEmails(hakemusID)
    expect(emails).toHaveLength(1)
    expect(emails[0].subject).toBe(
      'Automaattinen viesti: avustushakemuksen loppuselvitystä on täydennetty'
    )
    expect(emails[0]['to-address']).toStrictEqual(['santeri.horttanainen@reaktor.com'])
    expect(emails[0].formatted).toBe(`Avustushaku: ${avustushakuName}

Hakemuksen loppuselvitystä on täydennetty: ${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/hakemus/${hakemusID}/loppuselvitys/
`)
  })
  await test.step('hakija receives täydennys received email after creating submission', async () => {
    const emails = await getLoppuselvitysTaydennysReceivedHakijaNotificationEmails(hakemusID)
    expect(emails).toHaveLength(1)
    expect(emails[0].subject).toBe(
      'Automaattinen viesti: avustushakemuksenne loppuselvitystä on täydennetty'
    )
    expect(emails[0]['to-address']).toStrictEqual(['erkki.esimerkki@example.com'])
    const { registerNumber, avustushakuName } = hakuProps

    expect(emails[0].formatted).toBe(`Hyvä vastaanottaja,

tämä viesti koskee avustusta: ${registerNumber} ${avustushakuName}

Olemme vastaanottaneet loppuselvitystänne koskevat täydennykset ja selvityksenne tarkastus siirtyy seuraavaan vaiheeseen. Kun selvitys on käsitelty, ilmoitetaan siitä sähköpostitse avustuksen saajan viralliseen sähköpostiosoitteeseen sekä yhteyshenkilöille.

Ystävällisin terveisin,
_ valtionavustus
santeri.horttanainen@reaktor.com`)
  })
  await test.step('hakija täydennys is shown as diff', async () => {
    await hakemustenArviointiPage.navigateToHakemusArviointiLoppuselvitys(avustushakuID, hakemusID)
    await expect(oldAnswer.locator(tavoiteLocator)).toHaveText(defaultTavoite)
    await expect(newAnswer.locator(tavoiteLocator)).toHaveText(asiatarkastusTaydennysTavoite)
    await expect(oldAnswer.locator(yhteenvetoLocator)).toHaveText(defaultYhteenveto)
    await expect(newAnswer.locator(yhteenvetoLocator)).toHaveText(asiatarkastusTaydennysYhteenveto)
  })
  await test.step('submit T-icon is shown as hakija has sent täydennys', async () => {
    await hakemustenArviointiPage.toggleHakemusList.click()
    await expect(odottaaTaydennysta).toBeHidden()
    await expect(taydennykseenVastattu).toBeVisible()
  })
  await test.step('asiatarkastus enables taloustarkastus', async () => {
    await expect(loppuselvitysPage.locators.taloustarkastus.taydennyspyynto).toBeDisabled()
    await loppuselvitysPage.asiatarkastaLoppuselvitys('Ei huomioita')
    await expect(loppuselvitysPage.locators.asiatarkastus.taydennyspyynto).toBeDisabled()
    await expect(loppuselvitysPage.locators.taloustarkastus.taydennyspyynto).toBeEnabled()
  })
  await test.step('can send täydennyspyyntö email in taloustarkastus phase', async () => {
    const emailsBefore = await getLoppuselvitysTaydennyspyyntoTaloustarkastusEmails(hakemusID)
    expect(emailsBefore).toHaveLength(0)
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
    const emailsAfter = await getLoppuselvitysTaydennyspyyntoTaloustarkastusEmails(hakemusID)
    expect(emailsAfter).toHaveLength(1)
    expect(emailsAfter[0].subject).toBe(subject)
    expect(emailsAfter[0]['from-address']).toBe('santeri.horttanainen@reaktor.com')
  })
  await test.step('waiting T-icon is shown again as new täydennyspyyntö', async () => {
    await expect(odottaaTaydennysta).toBeVisible()
    await expect(taydennykseenVastattu).toBeHidden()
  })
  const hakijaSelvitysPage = HakijaSelvitysPage(page)
  await test.step('hakija can send täydennys until taloustarkastus has been done', async () => {
    await navigate(page, loppuselvitysFormUrl)
    const saving = hakijaSelvitysPage.page.getByText('Tallennetaan…')
    await expect(hakijaSelvitysPage.loppuselvitysWarning).toBeHidden()
    await expect(saving).toBeHidden()
    await expect(tavoiteLocator).toHaveValue(asiatarkastusTaydennysTavoite)
    await expect(yhteenvetoLocator).toHaveValue(asiatarkastusTaydennysYhteenveto)
    await tavoiteLocator.fill(taloustarkastusTaydennysTavoite)
    await yhteenvetoLocator.fill(taloustarkastusTaydennysYhteenveto)
    await expect(saving).toBeVisible()
    await expect(hakijaSelvitysPage.page.getByText('Tallennettu')).toBeVisible()
    await hakijaSelvitysPage.taydennysButton.click()
    await expect(hakijaSelvitysPage.taydennysButton).toBeHidden()
    await expect(tavoiteLocator).toHaveText(taloustarkastusTaydennysTavoite)
    await expect(yhteenvetoLocator).toHaveText(taloustarkastusTaydennysYhteenveto)
  })
  await test.step('virkailija receives täydennys received email again after hakija submission', async () => {
    const emails = await getLoppuselvitysTaydennysReceivedEmails(hakemusID)
    expect(emails).toHaveLength(2)
  })
  await test.step('shows diff of new answers for virkailija', async () => {
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    await expect(oldAnswer.locator(tavoiteLocator)).toHaveText(defaultTavoite)
    await expect(newAnswer.locator(tavoiteLocator)).toHaveText(taloustarkastusTaydennysTavoite)
    await expect(oldAnswer.locator(yhteenvetoLocator)).toHaveText(defaultYhteenveto)
    await expect(newAnswer.locator(yhteenvetoLocator)).toHaveText(
      taloustarkastusTaydennysYhteenveto
    )
  })
  await test.step('submit T-icon is shown again as hakija has sent täydennys', async () => {
    await hakemustenArviointiPage.toggleHakemusList.click()
    await expect(odottaaTaydennysta).toBeHidden()
    await expect(taydennykseenVastattu).toBeVisible()
  })
  await test.step('taloustarkastus disables all buttons and email is sent', async () => {
    const beforeSelvitysEmails = await getSelvitysEmails(avustushakuID)
    expect(beforeSelvitysEmails).toHaveLength(0)
    await loppuselvitysPage.taloustarkastaLoppuselvitys()
    await expect(loppuselvitysPage.locators.asiatarkastus.accept).toBeDisabled()
    await expect(loppuselvitysPage.locators.asiatarkastus.taydennyspyynto).toBeDisabled()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeDisabled()
    await expect(loppuselvitysPage.locators.taloustarkastus.taydennyspyynto).toBeDisabled()
    const afterSelvitysEmails = await getSelvitysEmails(avustushakuID)
    expect(afterSelvitysEmails).toHaveLength(1)
    expect(afterSelvitysEmails[0].subject).toBe(
      `Loppuselvitys 1/${hakuProps.registerNumber} käsitelty`
    )
  })
  await test.step('loppuselvitys form stays disabled for hakija', async () => {
    await navigate(page, loppuselvitysFormUrl)
    await expect(hakijaSelvitysPage.loppuselvitysWarning).toBeVisible()
    await expect(tavoiteLocator).toHaveText(taloustarkastusTaydennysTavoite)
    await expect(yhteenvetoLocator).toHaveText(taloustarkastusTaydennysYhteenveto)
    await expect(hakijaSelvitysPage.taydennysButton).toBeHidden()
    await expect(hakijaSelvitysPage.submitButton).toBeHidden()
  })

  await test.step('täydennyspyyntö T-icon is shown when hakemus list is loaded', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await expect(taydennykseenVastattu).toBeVisible()
  })
})
