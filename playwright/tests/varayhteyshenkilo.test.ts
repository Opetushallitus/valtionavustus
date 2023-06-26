import { expect } from '@playwright/test'
import { defaultValues } from '../fixtures/defaultValues'
import { MuutoshakemusFixtures } from '../fixtures/muutoshakemusTest'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'
import { readFile } from 'fs/promises'
import { HakijaAvustusHakuPage } from '../pages/hakijaAvustusHakuPage'
import { HakemustenArviointiPage } from '../pages/hakemustenArviointiPage'

const test = defaultValues.extend<MuutoshakemusFixtures>({
  answers: async ({ answers }, use) => {
    await use({
      ...answers,
      trustedContact: {
        name: 'Ville Varayhteyshenkilö',
        email: 'ville.vara@example.com',
        phoneNumber: '0405955959',
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
    console.log(__dirname + '../fixtures/varayhteys-henkilo.hakulomake.json')
    const lomakeJson = await readFile(
      __dirname + '/../fixtures/varayhteys-henkilo.hakulomake.json',
      'utf-8'
    )
    const { avustushakuID } = await hakujenHallintaPage.createHakuWithLomakeJson(
      lomakeJson,
      hakuProps
    )
    const haunTiedot = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedot.publishAvustushaku()
    await use(avustushakuID)
  },
})

test('varayhteyshenkilo flow', async ({ page, avustushakuID, answers }) => {
  const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page)
  await test.step('fill hakemus without varahenkilö', async () => {
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    await hakijaAvustusHakuPage.startAndFillApplication(answers, avustushakuID)

    await hakijaAvustusHakuPage.page.getByText('Liiketaloudellisin perustein toimiva yhtiö').click()
    await hakijaAvustusHakuPage.fillSignatories(answers.signatories!)
    await hakijaAvustusHakuPage.selectMaakuntaFromDropdown('Kainuu')
    await hakijaAvustusHakuPage.page.fill('#bank-iban', 'FI95 6682 9530 0087 65')
    await hakijaAvustusHakuPage.page.fill('#bank-bic', 'OKOYFIHH')
    await hakijaAvustusHakuPage.page.getByLabel('Opiskelijamäärä, nuorten oppimäärä').fill('25')
    await hakijaAvustusHakuPage.page.getByLabel('Opiskelijamäärä, aikuisten oppimäärä').fill('25')
    await hakijaAvustusHakuPage.page.getByLabel('Hankkeen nimi').fill(answers.projectName)
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
    await hakijaAvustusHakuPage.page
      .getByRole('button', { name: '3 vastauksessa puutteita' })
      .click()
    await expect(hakijaAvustusHakuPage.page.getByTestId('trusted-contact-name')).toBeVisible()
    await expect(hakijaAvustusHakuPage.page.getByTestId('trusted-contact-email')).toBeVisible()
    await expect(
      hakijaAvustusHakuPage.page.getByTestId('trusted-contact-phoneNumber')
    ).toBeVisible()
    await hakijaAvustusHakuPage.page
      .getByLabel('VarayhteyshenkilöVarayhteyshenkilöllä tarkoitetaan hankkeen varavastuuhenkilöä.')
      .fill(answers.trustedContact!.name)
    await expect(
      hakijaAvustusHakuPage.page.getByRole('button', { name: '2 vastauksessa puutteita' })
    ).toBeVisible()
    await expect(hakijaAvustusHakuPage.page.getByTestId('trusted-contact-email')).toBeVisible()
    await expect(
      hakijaAvustusHakuPage.page.getByTestId('trusted-contact-phoneNumber')
    ).toBeVisible()
    await hakijaAvustusHakuPage.page
      .locator('#trusted-contact-email')
      .fill(answers.trustedContact!.email)
    await expect(
      hakijaAvustusHakuPage.page.getByRole('button', { name: '1 vastauksessa puutteita' })
    ).toBeVisible()
    await expect(
      hakijaAvustusHakuPage.page.getByTestId('trusted-contact-phoneNumber')
    ).toBeVisible()
    await hakijaAvustusHakuPage.page
      .locator('#trusted-contact-phoneNumber')
      .fill(answers.trustedContact!.phoneNumber)
    await hakijaAvustusHakuPage.submitApplication()
  })
  await test.step('varayhteyshenkilö is shown in arviointi after submission', async () => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)
    const sidebarLocators = hakemustenArviointiPage.sidebarLocators()
    await expect(sidebarLocators.trustedContact.name).toHaveText(answers.trustedContact!.name)
    await expect(sidebarLocators.trustedContact.email).toHaveText(answers.trustedContact!.email)
    await expect(sidebarLocators.trustedContact.phoneNumber).toHaveText(
      answers.trustedContact!.phoneNumber
    )
  })
})
