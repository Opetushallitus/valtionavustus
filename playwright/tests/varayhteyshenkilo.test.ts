import { expect } from '@playwright/test'
import { defaultValues } from '../fixtures/defaultValues'
import { MuutoshakemusFixtures } from '../fixtures/muutoshakemusTest'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { readFile } from 'fs/promises'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import {
  getAcceptedPäätösEmails,
  getHakemusSubmitted,
  getLinkToMuutoshakemusFromSentEmails,
  getLoppuselvitysEmails,
  getAvustushakuRefusedEmails,
  getValiselvitysEmails,
  lastOrFail,
  Email,
  getSelvitysEmailsWithValiselvitysSubject,
  getSelvitysEmailsWithLoppuselvitysSubject,
} from '../utils/emails'
import { HakijaMuutoshakemusPage } from '../pages/hakija/hakijaMuutoshakemusPage'
import { navigate } from '../utils/navigate'
import { HakijaSelvitysPage } from '../pages/hakija/hakijaSelvitysPage'
import { expectToBeDefined } from '../utils/util'
import { LoppuselvitysPage } from '../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { ValiselvitysPage } from '../pages/virkailija/hakujen-hallinta/ValiselvitysPage'
import { RefusePage } from '../pages/hakija/refuse-page'
import { Answers } from '../utils/types'
import * as xlsx from 'xlsx'
import { HakulomakePage } from '../pages/virkailija/hakujen-hallinta/HakulomakePage'

type VarayhteyshenkiloAnswers = Answers & {
  trustedContact: {
    name: string
    email: string
    phone: string
  }
}

interface VarayhteyshenkiloFixtures extends MuutoshakemusFixtures {
  acceptedHakemusId: number
  answersWithTrustedContact: VarayhteyshenkiloAnswers
}

const test = defaultValues.extend<VarayhteyshenkiloFixtures>({
  answersWithTrustedContact: async ({ answers }, use) => {
    await use({
      ...answers,
      trustedContact: {
        name: 'Ville Varayhteyshenkilö',
        email: 'ville.vara@example.com',
        phone: '0405955959',
      },
      signatories: [
        {
          name: 'Erkki Esimerkki',
          email: 'erkki.esimerkki@example.com',
        },
      ],
    })
  },
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)
    expect(userCache).toBeDefined()
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const lomakeJson = await readFile(
      __dirname + '/../fixtures/varayhteys-henkilo.hakulomake.json',
      'utf-8'
    )
    const avustushakuID = await hakujenHallintaPage.copyEsimerkkihaku()
    await hakujenHallintaPage.fillAvustushaku(hakuProps)
    await hakujenHallintaPage.switchToHakulomakeTab()
    const formEditorPage = HakulomakePage(page)
    await test.step('lomake warning is shown before changing lomake to have required fields', async () => {
      await expect(formEditorPage.locators.lomakeWarning).toHaveCount(2)
      await expect(formEditorPage.locators.lomakeWarning.first()).toHaveText(
        'Hakemukselta puuttuu 3 varayhteyshenkilön täyttöön tarvittavaa kenttää.'
      )
      await formEditorPage.changeLomakeJson(lomakeJson)
      await expect(formEditorPage.locators.muutoshakuOk).toBeHidden()
      await formEditorPage.saveForm()
      await expect(formEditorPage.locators.lomakeWarning).toBeHidden()
      await expect(formEditorPage.locators.muutoshakuOk).toBeVisible()
    })
    const haunTiedot = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedot.publishAvustushaku()
    await use(avustushakuID)
  },
  acceptedHakemusId: async (
    {
      page,
      avustushakuID,
      answersWithTrustedContact: answers,
      ukotettuValmistelija,
      projektikoodi,
    },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await test.step('fill hakemus without varahenkilö', async () => {
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
      await hakijaAvustusHakuPage.startAndFillApplication(answers, avustushakuID)

      await hakijaAvustusHakuPage.page
        .getByText('Liiketaloudellisin perustein toimiva yhtiö')
        .click()
      await hakijaAvustusHakuPage.fillSignatories(answers.signatories!)
      await hakijaAvustusHakuPage.selectMaakuntaFromDropdown('Kainuu')
      await hakijaAvustusHakuPage.form.bank.iban.fill('FI95 6682 9530 0087 65')
      await hakijaAvustusHakuPage.form.bank.bic.fill('OKOYFIHH')
      const projectName = answers.projectName
      if (!projectName) {
        throw new Error('projectName must be set in order to fill form field')
      }
      await hakijaAvustusHakuPage.page.getByLabel('Opiskelijamäärä, nuorten oppimäärä').fill('25')
      await hakijaAvustusHakuPage.page.getByLabel('Opiskelijamäärä, aikuisten oppimäärä').fill('25')
      await hakijaAvustusHakuPage.page.getByLabel('Hankkeen nimi').fill(projectName)
      await hakijaAvustusHakuPage.page.getByText('Suomi').nth(1).click()
      await hakijaAvustusHakuPage.page.getByText('Opetuksen lisääminen').click()
      await hakijaAvustusHakuPage.page.getByLabel('Hankkeen alkamisaika').fill('1.1.2030')
      await hakijaAvustusHakuPage.page.getByLabel('Hankkeen päättymisaika').fill('1.1.2031')
      await hakijaAvustusHakuPage.page.getByText('Kyllä', { exact: true }).click()
      await hakijaAvustusHakuPage.page
        .locator('[id="personnel-costs-row\\.description"]')
        .fill('Palkat')
      await hakijaAvustusHakuPage.page.locator('[id="personnel-costs-row\\.amount"]').fill('1000')
      await hakijaAvustusHakuPage.page.locator('#self-financing-amount').fill('500')
    })
    await test.step('form validates correctly that its required', async () => {
      await hakijaAvustusHakuPage.page.reload()
      await hakijaAvustusHakuPage.validationErrors.haveErrorsButton(3).click()
      await expect(hakijaAvustusHakuPage.validationErrors.trustedContact.name).toBeVisible()
      await expect(hakijaAvustusHakuPage.validationErrors.trustedContact.email).toBeVisible()
      await expect(hakijaAvustusHakuPage.validationErrors.trustedContact.phone).toBeVisible()
      await hakijaAvustusHakuPage.page
        .getByLabel(
          'VarayhteyshenkilöVarayhteyshenkilöllä tarkoitetaan hankkeen varavastuuhenkilöä.'
        )
        .fill(answers.trustedContact.name)
      await expect(hakijaAvustusHakuPage.validationErrors.haveErrorsButton(2)).toBeVisible()
      await expect(hakijaAvustusHakuPage.validationErrors.trustedContact.email).toBeVisible()
      await expect(hakijaAvustusHakuPage.validationErrors.trustedContact.phone).toBeVisible()
      await hakijaAvustusHakuPage.form.trustedContact.email.fill(answers.trustedContact.email)
      await expect(hakijaAvustusHakuPage.validationErrors.haveErrorsButton(1)).toBeVisible()
      await expect(hakijaAvustusHakuPage.validationErrors.trustedContact.phone).toBeVisible()
      await hakijaAvustusHakuPage.form.trustedContact.phone.fill(answers.trustedContact.phone)
      await hakijaAvustusHakuPage.submitApplication()
    })
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    let hakemusID: number
    await test.step('varayhteyshenkilö gets notified about submitted hakemus', async () => {
      await hakemustenArviointiPage.navigate(avustushakuID)
      hakemusID = await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
      const emails = await getHakemusSubmitted(hakemusID)
      expect(emails).toHaveLength(1)
      expect(emails[0]['to-address']).toContain(answers.trustedContact.email)
    })
    await test.step('varayhteyshenkilö is shown in arviointi after submission', async () => {
      const sidebarLocators = hakemustenArviointiPage.sidebarLocators()
      await expect(sidebarLocators.trustedContact.name).toHaveText(answers.trustedContact.name)
      await expect(sidebarLocators.trustedContact.email).toHaveText(answers.trustedContact.email)
      await expect(sidebarLocators.trustedContact.phone).toHaveText(answers.trustedContact.phone)
    })
    const hakujenHallinta = new HakujenHallintaPage(page)
    await test.step('close and approve hakemus', async () => {
      const haunTiedot = await hakujenHallinta.navigate(avustushakuID)
      await haunTiedot.closeAvustushakuByChangingEndDateToPast()
      await haunTiedot.common.waitForSave()
      await hakemustenArviointiPage.navigate(avustushakuID)
      const projectName = answers.projectName
      if (!projectName) {
        throw new Error('projectName must be set in order to accept avustushaku')
      }
      await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)
      await hakemustenArviointiPage.acceptAvustushaku({
        avustushakuID,
        projectName,
        budget: '10000',
        projektikoodi,
      })
    })
    await test.step('varayhteyshenkilö gets notified about päätös', async () => {
      const haunTiedot = await hakujenHallinta.navigate(avustushakuID)
      await haunTiedot.resolveAvustushaku()
      const paatosTab = await haunTiedot.common.switchToPaatosTab()
      await paatosTab.sendPaatos()
      await expect(paatosTab.locators.paatosSentToEmails).toContainText(
        answers.trustedContact.email
      )
      const emails = await getAcceptedPäätösEmails(hakemusID)
      expect(emails).toHaveLength(1)
      expect(emails[0]['to-address']).toContain(answers.trustedContact.email)
    })
    await use(hakemusID!)
  },
})

const expectVarayhteyshenkiloColumns = (
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
  expect(sheet.O1.v).toEqual('Varayhteyshenkilö')
  expect(sheet.O2.v).toEqual(name)
  expect(sheet.P1.v).toEqual('Sähköposti')
  expect(sheet.P2.v).toEqual(email)
  expect(sheet.Q1.v).toEqual('Puhelinumero')
  expect(sheet.Q2.v).toEqual(phone)
}

test('varayhteyshenkilo flow', async ({
  page,
  avustushakuID,
  answersWithTrustedContact: answers,
  ukotettuValmistelija,
  acceptedHakemusId,
}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await test.step('expect excel to contain original info', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    const workbook = await hakemustenArviointiPage.getLataaExcel()
    expectVarayhteyshenkiloColumns(workbook, {
      name: answers.trustedContact.name,
      email: answers.trustedContact.email,
      phone: answers.trustedContact.phone,
    })
  })
  const hakujenHallinta = new HakujenHallintaPage(page)
  const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
  const muutoshakemusUrl = await getLinkToMuutoshakemusFromSentEmails(acceptedHakemusId)
  const newEmail = 'ville.korjattu@example.com'
  await test.step('varayhteyshenkilö email can be updated with muutoshakemus', async () => {
    await hakijaMuutoshakemusPage.navigateWithLink(muutoshakemusUrl)
    const { trustedContact } = hakijaMuutoshakemusPage.locators()
    await expect(trustedContact.name).toHaveValue(answers.trustedContact.name)
    await expect(trustedContact.email).toHaveValue(answers.trustedContact.email)
    await expect(trustedContact.phone).toHaveValue(answers.trustedContact.phone)
    await trustedContact.email.fill(newEmail)
    await hakijaMuutoshakemusPage.clickSaveContacts()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(false)
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await test.step('expect excel to new email', async () => {
      await hakemustenArviointiPage.closeHakemusDetails()
      const workbook = await hakemustenArviointiPage.getLataaExcel()
      expectVarayhteyshenkiloColumns(workbook, {
        name: answers.trustedContact.name,
        email: newEmail,
        phone: answers.trustedContact.phone,
      })
    })
    const projectName = answers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to select hakemus')
    }
    await hakemustenArviointiPage.selectHakemusFromList(projectName)
    const sidebar = hakemustenArviointiPage.sidebarLocators()
    await expect(sidebar.oldAnswers.trustedContactName).toBeHidden()
    await expect(sidebar.oldAnswers.trustedContactEmail).toHaveText(answers.trustedContact.email)
    await expect(sidebar.oldAnswers.trustedContactPhone).toBeHidden()
    await expect(sidebar.trustedContact.name).toHaveText(answers.trustedContact.name)
    await expect(sidebar.trustedContact.phone).toHaveText(answers.trustedContact.phone)
    await expect(sidebar.newAnswers.trustedContactName).toBeHidden()
    await expect(sidebar.newAnswers.trustedContactEmail).toHaveText(newEmail)
    await expect(sidebar.newAnswers.trustedContactPhone).toBeHidden()
  })

  await test.step('name and phone can also be changed with muutoshakemus', async () => {
    const projectName = answers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to select hakemus')
    }
    const newName = 'Ville Varahenkilö'
    const newPhone = '04059559599'
    const { trustedContact } = hakijaMuutoshakemusPage.locators()
    await hakijaMuutoshakemusPage.navigateWithLink(muutoshakemusUrl)
    await expect(trustedContact.name).toHaveValue(answers.trustedContact.name)
    await expect(trustedContact.email).toHaveValue(newEmail)
    await expect(trustedContact.phone).toHaveValue(answers.trustedContact.phone)
    await trustedContact.name.fill(newName)
    await trustedContact.phone.fill(newPhone)
    await hakijaMuutoshakemusPage.clickSaveContacts()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(false)
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await test.step('expect excel to contain new name and phone', async () => {
      await hakemustenArviointiPage.closeHakemusDetails()
      const workbook = await hakemustenArviointiPage.getLataaExcel()
      expectVarayhteyshenkiloColumns(workbook, {
        name: newName,
        email: newEmail,
        phone: newPhone,
      })
    })
    await hakemustenArviointiPage.selectHakemusFromList(projectName)
    const sidebar = hakemustenArviointiPage.sidebarLocators()
    await expect(sidebar.oldAnswers.trustedContactName).toHaveText(answers.trustedContact.name)
    await expect(sidebar.oldAnswers.trustedContactEmail).toHaveText(answers.trustedContact.email)
    await expect(sidebar.oldAnswers.trustedContactPhone).toHaveText(answers.trustedContact.phone)
    await expect(sidebar.newAnswers.trustedContactName).toHaveText(newName)
    await expect(sidebar.newAnswers.trustedContactEmail).toHaveText(newEmail)
    await expect(sidebar.newAnswers.trustedContactPhone).toHaveText(newPhone)
  })
  await test.step('väliselvitys gets sent to varayhteyshenkilö', async () => {
    const valiselvitysPage = await hakujenHallinta.navigateToValiselvitys(avustushakuID)
    await valiselvitysPage.sendValiselvitys()
    const tapahtumaloki = valiselvitysPage.tapahtumaloki
    await expect(tapahtumaloki.getByTestId('sender-0')).toHaveText(ukotettuValmistelija)
    await expect(tapahtumaloki.getByTestId('sent-0')).toHaveText('1')
    const emails = await getValiselvitysEmails(acceptedHakemusId)
    expect(emails).toHaveLength(1)
    expect(emails[0]['to-address']).not.toContain(answers.trustedContact.email)
    expect(emails[0]['to-address']).toContain(newEmail)
    const virkailijaValiselvitysPage = ValiselvitysPage(page)
    await virkailijaValiselvitysPage.navigateToValiselvitysTab(avustushakuID, acceptedHakemusId)
    const valiselvitysUrl = await virkailijaValiselvitysPage.linkToHakemus.getAttribute('href')
    expectToBeDefined(valiselvitysUrl)
    await navigate(page, valiselvitysUrl)
    const hakijaSelvitysPage = HakijaSelvitysPage(page)
    await hakijaSelvitysPage.fillCommonValiselvitysForm()
    await hakijaSelvitysPage.submitButton.click()
    await expect(hakijaSelvitysPage.submitButton).toHaveText('Väliselvitys lähetetty')
    await virkailijaValiselvitysPage.navigateToValiselvitysTab(avustushakuID, acceptedHakemusId)
    await virkailijaValiselvitysPage.acceptSelvitys()
    const emailsAfterAcceptance = await getSelvitysEmailsWithValiselvitysSubject(avustushakuID)
    const latestMail = lastOrFail(emailsAfterAcceptance)
    expect(latestMail['subject']).toContain('Väliselvitys')
    expect(latestMail['to-address']).not.toContain(answers.trustedContact.email)
    expect(latestMail['to-address']).toContain(newEmail)
  })
  await test.step('loppuselvitys gets sent to varayhteyshenkilö', async () => {
    const loppuselvitysPage = await hakujenHallinta.navigateToLoppuselvitys(avustushakuID)
    await loppuselvitysPage.sendLoppuselvitys()
    const tapahtumaloki = loppuselvitysPage.tapahtumaloki
    await expect(tapahtumaloki.getByTestId('sender-0')).toHaveText(ukotettuValmistelija)
    await expect(tapahtumaloki.getByTestId('sent-0')).toHaveText('1')
    const emails = await getLoppuselvitysEmails(acceptedHakemusId)
    expect(emails).toHaveLength(1)
    expect(emails[0]['to-address']).not.toContain(answers.trustedContact.email)
    expect(emails[0]['to-address']).toContain(newEmail)
    const virkailijaLoppuselvitysPage = LoppuselvitysPage(page)
    await virkailijaLoppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, acceptedHakemusId)
    const loppuselvitysUrl = await virkailijaLoppuselvitysPage.linkToHakemus.getAttribute('href')
    expectToBeDefined(loppuselvitysUrl)
    await navigate(page, loppuselvitysUrl)
    const hakijaSelvitysPage = HakijaSelvitysPage(page)
    await hakijaSelvitysPage.fillCommonLoppuselvitysForm()
    await hakijaSelvitysPage.submitButton.click()
    await expect(hakijaSelvitysPage.submitButton).toHaveText('Loppuselvitys lähetetty')
    await virkailijaLoppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, acceptedHakemusId)
    await loppuselvitysPage.ensureMuistutusViestiEmailRecipientsContain([
      'hakija-1424884@oph.fi',
      answers.contactPersonEmail,
      newEmail,
    ])
    await virkailijaLoppuselvitysPage.asiatarkastaLoppuselvitys('Ok')
    await virkailijaLoppuselvitysPage.taloustarkastaLoppuselvitys()
    let latestMail: Email | undefined
    await expect
      .poll(async () => {
        const emailsAfterAcceptance = await getSelvitysEmailsWithLoppuselvitysSubject(avustushakuID)
        latestMail = lastOrFail(emailsAfterAcceptance)
        return latestMail['subject']
      })
      .toContain('Loppuselvitys')
    expect(latestMail?.['to-address']).not.toContain(answers.trustedContact.email)
    expect(latestMail?.['to-address']).toContain(newEmail)
  })
})

test('varayhteyshenkilö refused avustushaku', async ({
  page,
  answersWithTrustedContact: answers,
  acceptedHakemusId,
}) => {
  const refusePage = RefusePage(page)
  await test.step('varayhteyshenkilö is shown in refusal page', async () => {
    await refusePage.navigate(acceptedHakemusId)
    expectToBeDefined(answers.trustedContact)
    await expect(refusePage.page.getByText(answers.trustedContact.name)).toBeVisible()
    await expect(refusePage.page.getByText(answers.trustedContact.email)).toBeVisible()
    await expect(refusePage.page.getByText(answers.trustedContact.phone)).toBeVisible()
  })
  await test.step('refuse avustushaku', async () => {
    await refusePage.refuseGrant()
  })
  await test.step('varayhteyshenkilö gets notified about refusing avustushaku', async () => {
    const emails = await getAvustushakuRefusedEmails(acceptedHakemusId)
    expect(emails).toHaveLength(1)
    expect(emails[0]['subject']).toEqual(
      'Ilmoitus avustuksenne vastaanottamatta jättämisestä on lähetetty'
    )
    const to = emails[0]['to-address']
    expect(to).toHaveLength(3)
    expect(to).toContain(answers.contactPersonEmail)
    expect(to).toContain(answers.trustedContact.email)
    expect(to).toContain('hakija-1424884@oph.fi')
  })
})
