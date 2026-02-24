import { expect, Page } from '@playwright/test'
import { yhteishankeTest as test } from '../../fixtures/yhteishankeTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import { getAvustushakuEmails } from '../../utils/emails'
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

  await test.step('verify yhteishanke hakemus submitted email is sent', async () => {
    let emails: Awaited<ReturnType<typeof getAvustushakuEmails>> = []
    await expect
      .poll(
        async () => {
          emails = await getAvustushakuEmails(avustushakuID, 'yhteishanke-hakemus-submitted')
          return emails.length
        },
        { timeout: 30_000, message: 'Waiting for yhteishanke hakemus submitted email' }
      )
      .toBeGreaterThanOrEqual(1)

    const orgEmail = emails.find((e) => e['to-address'].includes('eka@ensimmainen.fi'))
    expect(orgEmail).toBeDefined()
    expect(orgEmail!.subject).toContain('Automaattinen viesti: Yhteishankkeen avustushakemus')
    expect(orgEmail!.subject).toContain(avustushakuName)
  })

  await test.step('close avustushaku', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.setEndDate(moment().subtract(1, 'year').format('D.M.YYYY H.mm'))
  })

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  let hakemusID: number

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
  })

  await test.step('verify yhteishanke paatos email is sent', async () => {
    let emails: Awaited<ReturnType<typeof getAvustushakuEmails>> = []
    await expect
      .poll(
        async () => {
          emails = await getAvustushakuEmails(avustushakuID, 'yhteishanke-paatos')
          return emails.length
        },
        { timeout: 30_000, message: 'Waiting for yhteishanke paatos email' }
      )
      .toBeGreaterThanOrEqual(1)

    const orgEmail = emails.find((e) => e['to-address'].includes('eka@ensimmainen.fi'))
    expect(orgEmail).toBeDefined()
    expect(orgEmail!.subject).toContain('Automaattinen viesti: Yhteishankkeen avustushakemus')
    expect(orgEmail!.subject).toContain('käsitelty')
  })
})
