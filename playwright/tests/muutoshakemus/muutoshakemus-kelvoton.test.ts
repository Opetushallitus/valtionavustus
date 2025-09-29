import { expect } from '@playwright/test'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { dummyExcelPath, dummyPdfPath, HAKIJA_URL, TEST_Y_TUNNUS } from '../../utils/constants'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { getAcceptedPäätösEmails, waitUntilMinEmails } from '../../utils/emails'
import moment from 'moment'
import { expectToBeDefined } from '../../utils/util'
import fs from 'fs'
import * as path from 'path'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'

const muutoshakuDisabledMenoluokiteltuLomakeJson = fs.readFileSync(
  path.join(__dirname, '../../fixtures/muutoshakemus-disabled-menoluokiteltu.hakulomake.json'),
  'utf8'
)

test('hakija does not get an email with link to muutoshakemus when avustushaku fields could not be normalized', async ({
  userCache,
  page,
  answers,
  hakuProps,
  ukotettuValmistelija,
}, testInfo) => {
  expectToBeDefined(userCache)
  testInfo.setTimeout(testInfo.timeout + 30_000)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const avustushakuID = await hakujenHallintaPage.copyEsimerkkihaku()
  await hakujenHallintaPage.fillAvustushaku(hakuProps)
  const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
  await haunTiedotPage.publishAvustushaku()
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)

  const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
    avustushakuID,
    answers.contactPersonEmail
  )
  await hakijaAvustusHakuPage.page.goto(hakemusUrl)
  await test.step('fill application', async () => {
    await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)
    await hakijaAvustusHakuPage.page.fill('#applicant-name', answers.contactPersonName)
    await hakijaAvustusHakuPage.page.fill('#signature', answers.contactPersonName)
    await hakijaAvustusHakuPage.page.fill('#signature-email', answers.contactPersonEmail)
    await hakijaAvustusHakuPage.form.bank.iban.fill('FI95 6682 9530 0087 65')
    await hakijaAvustusHakuPage.form.bank.bic.fill('OKOYFIHH')
    await hakujenHallintaPage.page.click('text="Kansanopisto"')
    await hakujenHallintaPage.page.fill("[name='project-costs-row.amount']", '100000')
    await hakijaAvustusHakuPage.page
      .locator("[name='previous-income-statement-and-balance-sheet']")
      .setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.page
      .locator("[name='previous-financial-year-report']")
      .setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.page
      .locator("[name='previous-financial-year-auditor-report']")
      .setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.page
      .locator("[name='current-year-plan-for-action-and-budget']")
      .setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.page
      .locator("[name='description-of-functional-development-during-last-five-years']")
      .setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.page
      .locator("[name='financial-information-form']")
      .setInputFiles(dummyPdfPath)
  })
  await hakijaAvustusHakuPage.submitApplication()
  await hakujenHallintaPage.navigate(avustushakuID)
  await haunTiedotPage.setEndDate(moment().subtract(1, 'year').format('D.M.YYYY H.mm'))
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  let hakemusID: number | undefined
  await test.step('accept hakemus', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectHakemusFromList(hakuProps.registerNumber)
    hakemusID = await hakemustenArviointiPage.getHakemusID()
    expectToBeDefined(hakemusID)
    const { taTili } = hakemustenArviointiPage.arviointiTabLocators()
    await taTili.input.fill('Ammatillinen koulutus')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await hakemustenArviointiPage.acceptHakemus()
    await hakemustenArviointiPage.waitForSave()
  })
  await test.step('Resolve avustushaku', async () => {
    const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
    await haunTiedotPage.resolveAvustushaku()
  })

  await test.step('Add valmistelija for hakemus', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID!, ukotettuValmistelija)
  })
  await test.step('send päätökset', async () => {
    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.sendPaatos()
  })
  const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID!)
  emails.forEach((email) => {
    expect(email.formatted).not.toContain(`${HAKIJA_URL}/muutoshakemus`)
  })
})

const akuTest = defaultValues.extend<{
  avustushakuID: number
  hakemusID: number
}>({
  avustushakuID: async ({ page, hakuProps, userCache }, use) => {
    expectToBeDefined(userCache)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const { avustushakuID } = await hakujenHallintaPage.createHakuWithLomakeJson(
      muutoshakuDisabledMenoluokiteltuLomakeJson,
      hakuProps
    )
    await use(avustushakuID)
  },
  hakemusID: async (
    { page, answers, hakuProps, userCache, avustushakuID, ukotettuValmistelija },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 60_000)
    expectToBeDefined(userCache)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(avustushakuID)
    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.publishAvustushaku()
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)

    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    )
    await hakijaAvustusHakuPage.page.goto(hakemusUrl)
    await test.step('fill info', async () => {
      await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)
      await hakijaAvustusHakuPage.page.fill('#applicant-name', answers.contactPersonName)
      await hakijaAvustusHakuPage.page.fill("[id='textField-5']", answers.contactPersonPhoneNumber)
      await hakijaAvustusHakuPage.page.fill("[id='textField-2']", 'Paratiisitie 13') // postiosoite
      await hakijaAvustusHakuPage.page.fill("[id='textField-3']", '00313') // postinumero
      await hakijaAvustusHakuPage.page.fill("[id='textField-4']", 'Ankkalinna') // postitoimipaikka
      await hakijaAvustusHakuPage.page.click('[id="koodistoField-1_input"]') // maakunta
      await hakijaAvustusHakuPage.page.keyboard.type('Kainuu')
      await hakijaAvustusHakuPage.page.keyboard.press('ArrowDown')
      await hakijaAvustusHakuPage.page.keyboard.press('Enter')
      await hakijaAvustusHakuPage.page.click('label[for="radioButton-0.radio.0"]') // Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko
      await hakijaAvustusHakuPage.page.fill(
        "[id='signatories-fieldset-1.name']",
        'Teppo Testityyppi'
      )
      await hakijaAvustusHakuPage.page.fill(
        "[id='signatories-fieldset-1.email']",
        'teppo.testityyppi@example.com'
      )
      await hakijaAvustusHakuPage.form.bank.iban.fill('FI95 6682 9530 0087 65')
      await hakijaAvustusHakuPage.form.bank.bic.fill('OKOYFIHH')
      await hakijaAvustusHakuPage.page.fill('#project-name', answers.projectName)
      await hakijaAvustusHakuPage.page.click('label[for="combined-effort.radio.1"]') // yhteishanke = ei
      await hakijaAvustusHakuPage.page.fill('#textArea-2', 'Ei osaamista') // Hakijayhteisön osaaminen ja kokemus opetustoimen henkilöstökoulutuksesta
      await hakijaAvustusHakuPage.page.fill('#textArea-3', 'Ei osaamista') // Koulutushankkeen kouluttajat, heidän osaamisensa ja kokemuksensa opetustoimen ja varhaiskasvatuksen henkilöstökoulutuksesta
      await hakijaAvustusHakuPage.page.click('label[for="radioButton-1.radio.0"]') // Teema: Johtamisosaamisen ja yhteisöllisen kehittämisen vahvistaminen
      await hakijaAvustusHakuPage.page.click('label[for="radioButton-2.radio.0"]') // Mistä muista kohderyhmistä koulutukseen voi osallistua: Varhaiskasvatus
      await hakijaAvustusHakuPage.page.fill(
        '#project-goals',
        'Ostetaan Pelle Pelottomalle uusi aikakone'
      ) // Hanke pähkinänkuoressa
      await hakijaAvustusHakuPage.page.fill(
        '#textArea-7',
        'Jälki-istunto. Iltakoulu. Kannettu vesi.'
      ) // kolme koulutuksen sisältöä kuvaavaa asiasanaa tai sanaparia
      await hakijaAvustusHakuPage.page.fill('#textArea-4', 'Ei mitenkään') // Miksi hanke tarvitaan? Miten koulutustarve on kartoitettu?
      await hakijaAvustusHakuPage.page.fill('#textArea-5', 'Päästä matkustamaan tulevaisuuteen') // Hankkeen tavoitteet, toteutustapa ja tulokset
      await hakijaAvustusHakuPage.page.fill(
        '#textArea-6',
        'Minä ja Pelle Peloton. Minä makaan riippumatossa ja kannustan Pelleä työntekoon'
      ) // Hankkeen osapuolet ja työnjako
      await hakijaAvustusHakuPage.page.fill('#textArea-1', 'Ankkalinna.') // Toteuttamispaikkakunnat
      await hakijaAvustusHakuPage.page.fill('#project-announce', 'Innostamalla') // Miten osallistujat rekrytoidaan koulutukseen?
      await hakijaAvustusHakuPage.page.fill(
        '#project-effectiveness',
        'Vahditaan ettei työntekijät laiskottele'
      ) // Miten hankkeen tavoitteiden toteutumista seurataan?
      await hakijaAvustusHakuPage.page.fill(
        '#project-spreading-plan',
        'Hanke tulee luultavasti leviämään käsiin itsestään'
      ) // Hankkeen tulosten levittämissuunnitelma
      await hakijaAvustusHakuPage.page.fill("[id='koulutusosiot.koulutusosio-1.nimi']", 'Eka osa') // Koulutusosion nimi
      await hakijaAvustusHakuPage.page.fill(
        "[id='koulutusosiot.koulutusosio-1.keskeiset-sisallot']",
        'Kaadetaan tietoa osallistujien päähän'
      ) // Keskeiset sisällöt ja toteuttamistapa
      await hakijaAvustusHakuPage.page.fill(
        "[id='koulutusosiot.koulutusosio-1.kohderyhmat']",
        'Veljenpojat'
      ) // Kohderyhmät
      await hakijaAvustusHakuPage.page.click(
        'label[for="koulutusosiot.koulutusosio-1.koulutettavapaivat.scope-type.radio.1"]'
      ) // Laajuus ilmoitettu koulutuspäivinä
      await hakijaAvustusHakuPage.page.fill(
        "[id='koulutusosiot.koulutusosio-1.koulutettavapaivat.scope']",
        '10'
      ) // Laajuus
      await hakijaAvustusHakuPage.page.fill(
        "[id='koulutusosiot.koulutusosio-1.koulutettavapaivat.person-count']",
        '2'
      ) // Osallistujamäärä
      await hakijaAvustusHakuPage.page.click('label[for="vat-included.radio.0"]') // Onko kustannukset ilmoitettu arvonlisäverollisina
      await hakijaAvustusHakuPage.page
        .locator("[name='namedAttachment-0']")
        .setInputFiles(dummyExcelPath)
    })

    await test.step('fill budget', async () => {
      await hakijaAvustusHakuPage.page
        .locator("[id='personnel-costs-row.description']")
        .fill('Liksat')
      await hakijaAvustusHakuPage.page.locator("[id='personnel-costs-row.amount']").fill('666')
      await hakijaAvustusHakuPage.page
        .locator("[id='material-costs-row.description']")
        .fill('Lakupiippuja')
      await hakijaAvustusHakuPage.page.locator("[id='material-costs-row.amount']").fill('4')
      await hakijaAvustusHakuPage.page.locator("[id='rent-costs-row.description']").fill('Bajamaja')
      await hakijaAvustusHakuPage.page.locator("[id='rent-costs-row.amount']").fill('14')
      await hakijaAvustusHakuPage.page
        .locator("[id='service-purchase-costs-row.description']")
        .fill('Shampanjan vispaajat')
      await hakijaAvustusHakuPage.page
        .locator("[id='service-purchase-costs-row.amount']")
        .fill('1000')
      await hakijaAvustusHakuPage.page
        .locator("[id='steamship-costs-row.description']")
        .fill('Apostolin kyyti')
      await hakijaAvustusHakuPage.page.locator("[id='steamship-costs-row.amount']").fill('0')
      await hakijaAvustusHakuPage.page.locator("[id='other-costs-row.description']").fill('Banaani')
      await hakijaAvustusHakuPage.page.locator("[id='other-costs-row.amount']").fill('10')
    })

    await hakijaAvustusHakuPage.submitApplication()
    await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.setEndDate(moment().subtract(1, 'year').format('D.M.YYYY H.mm'))
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    let hakemusID: number | undefined
    await test.step('accept hakemus', async () => {
      await hakemustenArviointiPage.navigate(avustushakuID)
      await hakemustenArviointiPage.selectHakemusFromList(hakuProps.registerNumber)
      hakemusID = await hakemustenArviointiPage.getHakemusID()
      const { taTili } = hakemustenArviointiPage.arviointiTabLocators()
      await taTili.input.fill('Ammatillinen koulutus')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await hakemustenArviointiPage.acceptHakemus()
      await hakemustenArviointiPage.waitForSave()
    })
    expectToBeDefined(hakemusID)
    await test.step('Resolve avustushaku', async () => {
      const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
      await haunTiedotPage.resolveAvustushaku()
    })
    await test.step('Add valmistelija for hakemus', async () => {
      await hakemustenArviointiPage.navigate(avustushakuID)
      await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID!, ukotettuValmistelija)
    })
    await test.step('send päätökset', async () => {
      const paatosPage = PaatosPage(page)
      await paatosPage.navigateTo(avustushakuID)
      await paatosPage.sendPaatos()
    })
    await use(hakemusID)
  },
})

akuTest(
  'muutoshakukelvoton avustushaku with menoluokat has been approved with lump sum',
  async ({ page, avustushakuID, hakemusID }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.clickHakemus(hakemusID)
    await hakemustenArviointiPage.tabs().seuranta.click()
    const seuranta = hakemustenArviointiPage.seurantaTabLocators()
    await test.step('total myönnetty amount is displayed correctly', async () => {
      await expect(seuranta.kustannusMyonnetty).toHaveText('100000')
    })
    await test.step('OPH:n hyväksymä amount is displayed correctly', async () => {
      await expect(seuranta.kustannusHyvaksytty).toHaveText('0')
    })
  }
)
