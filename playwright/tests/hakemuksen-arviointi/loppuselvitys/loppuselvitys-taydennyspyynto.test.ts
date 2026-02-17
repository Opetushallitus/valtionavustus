import { expect } from '@playwright/test'

import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { HakemustenArviointiPage } from '../../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import {
  getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails,
  getLoppuselvitysTaydennyspyyntoTaloustarkastusEmails,
  getLoppuselvitysTaydennysReceivedHakijaNotificationEmails,
  getLoppuselvitysTaydennysReceivedEmails,
  waitUntilMinEmails,
  getHakemusTokenAndRegisterNumber,
  getSelvitysEmailsWithLoppuselvitysSubject,
} from '../../../utils/emails'
import { HakijaSelvitysPage } from '../../../pages/hakija/hakijaSelvitysPage'
import { navigate } from '../../../utils/navigate'
import { VIRKAILIJA_URL, swedishAnswers } from '../../../utils/constants'
import { Answers } from '../../../utils/types'
import { expectIsFinnishOphEmail } from '../../../utils/email-signature'

test.extend<{ answers: Answers }>({
  answers: swedishAnswers,
})(
  'Loppuselvitys change request received swedish version to hakija',
  async ({
    page,
    acceptedHakemus: { hakemusID },
    avustushakuID,
    loppuselvitysSubmitted: { loppuselvitysFormUrl },
  }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const loppuselvitysPage = await hakemustenArviointiPage.navigateToHakemusArviointiLoppuselvitys(
      avustushakuID,
      hakemusID
    )

    const emails = await getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails(hakemusID)
    expect(emails).toHaveLength(0)
    await loppuselvitysPage.locators.asiatarkastus.taydennyspyynto.click()
    const arkistointiTunnus = await hakemustenArviointiPage.getArkistointitunnus()
    await test.step('has prefilled subject', async () => {
      await expect(
        page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-email-subject')
      ).toHaveValue(
        `Begäran om komplettering av slutredovisningen för statsunderstöd från Utbildningsstyrelsen: ${arkistointiTunnus} Vi Simmar i Pengar Ab`
      )
    })

    await test.step('has fixed header', async () => {
      await expect(page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-email-header'))
        .toHaveText(`Bästa mottagare

det här meddelandet gäller statsunderstödet: ${arkistointiTunnus} Vi Simmar i Pengar Ab`)
    })
    await test.step('has fixed footer', async () => {
      const footer = page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-email-footer')
      await expect(footer).toContainText(`Länk till blanktten för slutredovisning:`)
      await expect(footer).toContainText(`
      Redigera endast de ställen som ingår i begäran.

Vid behov kan ni be om mer information av avsändaren till detta meddelande.

Med vänlig hälsning`)
    })
    const subject = 'Behöver mer ångfartygspengar'
    await test.step('can send täydennyspyyntö email in asiatarkastus phase', async () => {
      await page
        .getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-email-subject')
        .fill(subject)
      await page
        .getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-email-content')
        .fill('Det fanns inte tillräckligt med pengar för ångfartyg')
      await page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-submit').click()

      await expect
        .poll(async () => {
          return (await getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails(hakemusID)).length
        })
        .toBe(1)
    })
    await test.step('email contains the contents shown in the form', async () => {
      const emails = await getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails(hakemusID)
      const email = emails[0]

      expect(email.subject).toBe(subject)
      expect(email.formatted).toContain('Det fanns inte tillräckligt med pengar för ångfartyg')
      expect(email.formatted).toContain(`Bästa mottagare

det här meddelandet gäller statsunderstödet: ${arkistointiTunnus} Vi Simmar i Pengar Ab

`)
      expect(email.formatted).toContain(`Redigera endast de ställen som ingår i begäran.

Vid behov kan ni be om mer information av avsändaren till detta meddelande.

Med vänlig hälsning`)
    })
    const tavoiteLocator = page.locator('[id="project-description.project-description-1.goal"]')
    const defaultTavoite = 'Tavoite'
    const asiatarkastusTaydennysTavoite = 'Tavoite parannettu'
    const yhteenvetoLocator = page.locator('[id="textArea-0"]')
    const defaultYhteenveto = 'Yhteenveto'
    const asiatarkastusTaydennysYhteenveto = 'Yhteenveto parempi'
    await test.step('hakija can send täydennys', async () => {
      expect(await getLoppuselvitysTaydennysReceivedEmails(hakemusID)).toHaveLength(0)
      await navigate(page, loppuselvitysFormUrl)
      const hakijaSelvitysPage = HakijaSelvitysPage(page, 'sv')
      await expect(tavoiteLocator).toHaveValue(defaultTavoite)
      await expect(yhteenvetoLocator).toHaveValue(defaultYhteenveto)
      await tavoiteLocator.fill(asiatarkastusTaydennysTavoite)
      await yhteenvetoLocator.fill(asiatarkastusTaydennysYhteenveto)
      await hakijaSelvitysPage.taydennysButton.click()
    })

    await test.step('hakija receives täydennys received email after creating submission', async () => {
      const emails = await waitUntilMinEmails(
        getLoppuselvitysTaydennysReceivedHakijaNotificationEmails,
        1,
        hakemusID
      )
      const email = emails[0]
      const { 'register-number': registerNumber } =
        await getHakemusTokenAndRegisterNumber(hakemusID)

      expect(email.subject).toBe(
        `Slutredovisningen för er organisation är kompletterad: ${registerNumber} Vi Simmar i Pengar Ab`
      )
      expect(email.formatted).toContain(
        `Bästa mottagare\n\n` +
          `det här meddelandet gäller statsunderstödet: ${registerNumber} Vi Simmar i Pengar Ab\n\n` +
          `Vi har tagit emot kompletteringarna till er slutredovisning och den går nu vidare till nästa skede av granskningen. När slutredovisningen är slutbehandlad sänder vi  ett e-postmeddelande till organisationens officiella e-postadress och kontaktpersonen för mottagaren av statsunderstödet.\n\n` +
          `Med vänlig hälsning\n` +
          `_ valtionavustus\n` +
          `santeri.horttanainen@reaktor.com`
      )

      expect(email.formatted).toContain(
        'Utbildningsstyrelsen\n' +
          'Hagnäskajen 6\n' +
          'PB 380, 00531 Helsingfors\n' +
          'telefon 029 533 1000\n' +
          'fornamn.efternamn@oph.fi'
      )
    })
  }
)

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
    const email1 = 'hakija-1424884@oph.fi'
    await expect(
      page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-receiver-0')
    ).toHaveValue(email1)
    const email2 = 'erkki.esimerkki@example.com'
    await expect(
      page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-receiver-1')
    ).toHaveValue(email2)
    await page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-add-receiver').click()
    const email3 = 'erkki.esimerkki2@example.com'
    await page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-receiver-2').fill(email3)
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
    await expect(page.getByText(`Vastaanottajat${email1}, ${email2}, ${email3}`)).toBeVisible()
    await expect(page.getByText(`Aihe${subject}`)).toBeVisible()
    const emailsAfterSending = await waitUntilMinEmails(
      getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails,
      1,
      hakemusID
    )
    expect(emailsAfterSending).toHaveLength(1)
  })
  await test.step('waiting T-icon as täydennys has been sent', async () => {
    await expect(odottaaTaydennysta).toBeVisible()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeDisabled()
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
    const emails = await waitUntilMinEmails(getLoppuselvitysTaydennysReceivedEmails, 1, hakemusID)
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
    const { 'register-number': registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const emails = await getLoppuselvitysTaydennysReceivedHakijaNotificationEmails(hakemusID)
    const email = emails[0]
    expect(emails).toHaveLength(1)
    expect(email.subject).toBe(
      `Organisaationne loppuselvitystä on täydennetty: ${registerNumber} Rahassa kylpijät Ky Ay Oy`
    )
    expect(email['to-address']).toStrictEqual([
      'erkki.esimerkki@example.com',
      'hakija-1424884@oph.fi',
    ])

    expect(email.formatted).toContain(
      `Hyvä vastaanottaja,\n\n` +
        `tämä viesti koskee avustusta: ${registerNumber} Rahassa kylpijät Ky Ay Oy\n\n` +
        `Olemme vastaanottaneet loppuselvitystänne koskevat täydennykset ja selvityksenne tarkastus siirtyy seuraavaan vaiheeseen. Kun selvitys on käsitelty, ilmoitetaan siitä sähköpostitse avustuksen saajan viralliseen sähköpostiosoitteeseen sekä yhteyshenkilöille.\n\n` +
        `Ystävällisin terveisin,\n` +
        `_ valtionavustus\n` +
        `santeri.horttanainen@reaktor.com`
    )
    await expectIsFinnishOphEmail(email)
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
    const email1 = 'hakija-1424884@oph.fi'
    await expect(
      page.getByTestId('loppuselvitys-taydennyspyynto-taloustarkastus-receiver-0')
    ).toHaveValue(email1)
    const email2 = 'erkki.esimerkki@example.com'
    await expect(
      page.getByTestId('loppuselvitys-taydennyspyynto-taloustarkastus-receiver-1')
    ).toHaveValue(email2)
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
    expect(emailsAfter[0]['from-address']).toBe('no-reply@valtionavustukset.oph.fi')
    expect(emailsAfter[0]['reply-to']).toBe('santeri.horttanainen@reaktor.com')
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
    const emails = await waitUntilMinEmails(getLoppuselvitysTaydennysReceivedEmails, 2, hakemusID)
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
    const beforeSelvitysEmails = await getSelvitysEmailsWithLoppuselvitysSubject(avustushakuID)
    expect(beforeSelvitysEmails).toHaveLength(0)
    await loppuselvitysPage.taloustarkastaLoppuselvitys()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeHidden()
    await expect(loppuselvitysPage.locators.asiatarkastus.taydennyspyynto).toBeDisabled()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeDisabled()
    await expect(loppuselvitysPage.locators.taloustarkastus.taydennyspyynto).toBeDisabled()
    let afterSelvitysEmails: Awaited<ReturnType<typeof getSelvitysEmailsWithLoppuselvitysSubject>> =
      []
    await expect
      .poll(async () => {
        afterSelvitysEmails = await getSelvitysEmailsWithLoppuselvitysSubject(avustushakuID)
        return afterSelvitysEmails.length
      })
      .toEqual(1)
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
