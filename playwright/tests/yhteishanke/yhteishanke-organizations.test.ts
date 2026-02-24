import { expect, Page } from '@playwright/test'
import { yhteishankeTest as test } from '../../fixtures/yhteishankeTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakijaSelvitysPage } from '../../pages/hakija/hakijaSelvitysPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { ValiselvitysPage } from '../../pages/virkailija/hakujen-hallinta/ValiselvitysPage'
import { LoppuselvitysPage } from '../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import { getAvustushakuEmails, getHakemusTokenAndRegisterNumber } from '../../utils/emails'
import { navigate } from '../../utils/navigate'
import moment from 'moment'

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
    remove: baseLocator.getByTitle('poista'),
  }
}

async function expectYhteishankeEmails(
  avustushakuID: number,
  emailType: string,
  expectedRecipients: string[],
  subjectContains: string[]
) {
  let emails: Awaited<ReturnType<typeof getAvustushakuEmails>> = []
  await expect
    .poll(
      async () => {
        emails = await getAvustushakuEmails(avustushakuID, emailType)
        return emails.length
      },
      { timeout: 30_000, message: `Waiting for ${emailType} emails` }
    )
    .toBeGreaterThanOrEqual(expectedRecipients.length)

  const recipients = emails.flatMap((e) => e['to-address'])
  for (const expected of expectedRecipients) {
    expect(recipients).toContain(expected)
  }

  for (const email of emails) {
    expect(email['to-address']).toHaveLength(1)
    for (const text of subjectContains) {
      expect(email.subject).toContain(text)
    }
  }
}

test('yhteishanke organizations: fill, submit, and receive emails through lifecycle', async ({
  page,
  avustushakuID,
  submittedHakemusUrl,
  answers,
  avustushakuName,
  projektikoodi,
  codes,
  ukotettuValmistelija,
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 300_000)
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  const first = otherOrganization(page, 0)
  const second = otherOrganization(page, 1)

  await test.step('enable combined-effort', async () => {
    await page.locator("[for='combined-effort.radio.0']").click()
    await expect(first.name).toBeVisible()
  })

  await test.step('fill first organization', async () => {
    await first.name.fill('Ensimmäinen Organisaatio Oy')
    await first.contactPerson.fill('Eka Henkilö')
    await first.email.fill('eka@ensimmainen.fi')
  })

  await test.step('second organization row becomes enabled', async () => {
    await expect(second.name).toBeEnabled()
  })

  await test.step('fill second organization', async () => {
    await second.name.fill('Toinen Organisaatio Oy')
    await second.contactPerson.fill('Toka Henkilö')
    await second.email.fill('toka@toinen.fi')
  })

  await test.step('fill remaining required fields and submit', async () => {
    await page.locator("[id='project-costs-row.amount']").fill('20000')
    await page.locator("[for='type-of-organization.radio.0']").click()
    await page.locator("[id='signature']").fill('Erkki Esimerkki')
    await page.locator("[id='signature-email']").fill('erkki@example.com')
    await page.locator('#bank-iban').fill('FI95 6682 9530 0087 65')
    await page.locator('#bank-bic').fill('OKOYFIHH')

    await hakijaAvustusHakuPage.waitForEditSaved()
    await hakijaAvustusHakuPage.submitApplication()
  })

  await test.step('verify yhteishanke hakemus submitted emails are sent separately per organization', async () => {
    await expectYhteishankeEmails(
      avustushakuID,
      'yhteishanke-hakemus-submitted',
      ['eka@ensimmainen.fi', 'toka@toinen.fi'],
      [
        `Automaattinen viesti: Yhteishankkeen avustushakemus ${avustushakuName} on kirjattu vastaanotetuksi`,
      ]
    )
  })

  await test.step('close avustushaku', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.setEndDate(moment().subtract(1, 'year').format('D.M.YYYY H.mm'))
  })

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  let hakemusID: number
  let registerNumber: string

  await test.step('accept hakemus', async () => {
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
  })

  await test.step('add valmistelija for hakemus', async () => {
    await hakemustenArviointiPage.closeHakemusDetails()
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)
  })

  await test.step('resolve avustushaku', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.resolveAvustushaku()
  })

  await test.step('send paatos', async () => {
    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.sendPaatos()
    const tokenAndRegister = await getHakemusTokenAndRegisterNumber(hakemusID)
    registerNumber = tokenAndRegister['register-number']
  })

  await test.step('verify yhteishanke paatos emails are sent separately per organization', async () => {
    await expectYhteishankeEmails(
      avustushakuID,
      'yhteishanke-paatos',
      ['eka@ensimmainen.fi', 'toka@toinen.fi'],
      [
        `Automaattinen viesti: Yhteishankkeen avustushakemus ${registerNumber} on käsitelty - Linkki päätösasiakirjaan`,
      ]
    )
  })

  await test.step('send väliselvityspyynnöt, submit väliselvitys, and verify emails', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const valiselvitysPage = await hakujenHallintaPage.navigateToValiselvitys(avustushakuID)

    await valiselvitysPage.sendValiselvitys()

    await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, hakemusID)
    const valiselvitysFormUrl = await valiselvitysPage.linkToHakemus.getAttribute('href')
    if (!valiselvitysFormUrl) {
      throw new Error('Väliselvitys form URL not found')
    }
    await navigate(page, valiselvitysFormUrl)
    const hakijaSelvitysPage = HakijaSelvitysPage(page)
    await hakijaSelvitysPage.fillCommonValiselvitysForm()
    await hakijaSelvitysPage.submitButton.click()
    await expect(hakijaSelvitysPage.submitButton).toHaveText('Väliselvitys lähetetty')

    await expectYhteishankeEmails(
      avustushakuID,
      'yhteishanke-valiselvitys-submitted',
      ['eka@ensimmainen.fi', 'toka@toinen.fi'],
      [`Automaattinen viesti: Yhteishankkeen ${registerNumber} väliselvitys on vastaanotettu`]
    )
  })

  await test.step('process väliselvitys and verify emails', async () => {
    const valiselvitysPage = ValiselvitysPage(page)
    await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, hakemusID)
    await valiselvitysPage.acceptSelvitys()

    await expectYhteishankeEmails(
      avustushakuID,
      'yhteishanke-valiselvitys-processed',
      ['eka@ensimmainen.fi', 'toka@toinen.fi'],
      [`Automaattinen viesti: Yhteishankkeen ${registerNumber} väliselvitys on käsitelty`]
    )
  })

  await test.step('submit and accept muutoshakemus, verify emails', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues({
      jatkoaika: moment().add(1, 'year'),
      jatkoaikaPerustelu: 'Tarvitaan lisäaikaa yhteishankkeen toteutukseen',
    })
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true)

    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await muutoshakemusTab.setMuutoshakemusJatkoaikaDecision('accepted')
    await muutoshakemusTab.writePerustelu('Hyväksytään yhteishankkeen jatkoaika')
    await muutoshakemusTab.saveMuutoshakemus()

    await expectYhteishankeEmails(
      avustushakuID,
      'yhteishanke-muutoshakemus-paatos',
      ['eka@ensimmainen.fi', 'toka@toinen.fi'],
      [`Automaattinen viesti: Yhteishankkeen ${registerNumber} muutoshakemus on käsitelty`]
    )
  })

  await test.step('send loppuselvityspyynnöt, submit loppuselvitys, and verify emails', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const loppuselvitysPage = await hakujenHallintaPage.navigateToLoppuselvitys(avustushakuID)

    await loppuselvitysPage.sendLoppuselvitys()

    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    const loppuselvitysFormUrl = await loppuselvitysPage.getSelvitysFormUrl()
    await navigate(page, loppuselvitysFormUrl)
    const hakijaSelvitysPage = HakijaSelvitysPage(page)
    await hakijaSelvitysPage.fillCommonLoppuselvitysForm()
    await hakijaSelvitysPage.submitButton.click()
    await expect(hakijaSelvitysPage.submitButton).toHaveText('Loppuselvitys lähetetty')

    await expectYhteishankeEmails(
      avustushakuID,
      'yhteishanke-loppuselvitys-submitted',
      ['eka@ensimmainen.fi', 'toka@toinen.fi'],
      [`Automaattinen viesti: Yhteishankkeen ${registerNumber} loppuselvitys on vastaanotettu`]
    )
  })

  await test.step('process loppuselvitys and verify emails', async () => {
    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    await loppuselvitysPage.asiatarkastaLoppuselvitys('Näyttää hyvältä, hyväksytään asiatarkastus')
    await loppuselvitysPage.taloustarkastaLoppuselvitys()

    await expectYhteishankeEmails(
      avustushakuID,
      'yhteishanke-loppuselvitys-processed',
      ['eka@ensimmainen.fi', 'toka@toinen.fi'],
      [`Automaattinen viesti: Yhteishankkeen ${registerNumber} loppuselvitys on käsitelty`]
    )
  })
})

test('yhteishanke rejection: paatos-refuse emails sent separately per organization', async ({
  page,
  avustushakuID,
  submittedHakemusUrl,
  answers,
  avustushakuName,
  projektikoodi,
  codes,
  ukotettuValmistelija,
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 120_000)
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  const first = otherOrganization(page, 0)
  const second = otherOrganization(page, 1)

  await test.step('enable combined-effort', async () => {
    await page.locator("[for='combined-effort.radio.0']").click()
    await expect(first.name).toBeVisible()
  })

  await test.step('fill first organization', async () => {
    await first.name.fill('Ensimmäinen Organisaatio Oy')
    await first.contactPerson.fill('Eka Henkilö')
    await first.email.fill('eka@ensimmainen.fi')
  })

  await test.step('second organization row becomes enabled', async () => {
    await expect(second.name).toBeEnabled()
  })

  await test.step('fill second organization', async () => {
    await second.name.fill('Toinen Organisaatio Oy')
    await second.contactPerson.fill('Toka Henkilö')
    await second.email.fill('toka@toinen.fi')
  })

  await test.step('fill remaining required fields and submit', async () => {
    await page.locator("[id='project-costs-row.amount']").fill('20000')
    await page.locator("[for='type-of-organization.radio.0']").click()
    await page.locator("[id='signature']").fill('Erkki Esimerkki')
    await page.locator("[id='signature-email']").fill('erkki@example.com')
    await page.locator('#bank-iban').fill('FI95 6682 9530 0087 65')
    await page.locator('#bank-bic').fill('OKOYFIHH')

    await hakijaAvustusHakuPage.waitForEditSaved()
    await hakijaAvustusHakuPage.submitApplication()
  })

  await test.step('close avustushaku', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.setEndDate(moment().subtract(1, 'year').format('D.M.YYYY H.mm'))
  })

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  let hakemusID: number
  let registerNumber: string

  await test.step('reject hakemus', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    const projectName = answers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to reject avustushaku')
    }
    await hakemustenArviointiPage.selectHakemusFromList(projectName)
    hakemusID = await hakemustenArviointiPage.getHakemusID()
    await hakemustenArviointiPage.selectProject(projektikoodi, codes)
    await hakemustenArviointiPage.rejectHakemus()
  })

  await test.step('add valmistelija for hakemus', async () => {
    await hakemustenArviointiPage.closeHakemusDetails()
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)
  })

  await test.step('resolve avustushaku', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.resolveAvustushaku()
  })

  await test.step('send paatos', async () => {
    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.sendPaatos()
    const tokenAndRegister = await getHakemusTokenAndRegisterNumber(hakemusID)
    registerNumber = tokenAndRegister['register-number']
  })

  await test.step('verify yhteishanke paatos-refuse emails', async () => {
    await expectYhteishankeEmails(
      avustushakuID,
      'yhteishanke-paatos-refuse',
      ['eka@ensimmainen.fi', 'toka@toinen.fi'],
      [
        `Automaattinen viesti: ${registerNumber} avustushakemus on käsitelty - Linkki päätösasiakirjaan`,
      ]
    )
  })
})
