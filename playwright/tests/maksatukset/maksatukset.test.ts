import { APIRequestContext, expect } from '@playwright/test'

import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { KoodienhallintaPage } from '../../pages/virkailija/koodienHallintaPage'
import { getHakemusTokenAndRegisterNumber } from '../../utils/emails'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { MaksatuksetPage } from '../../pages/virkailija/hakujen-hallinta/maksatuksetPage'
import {
  HakujenHallintaPage,
  Installment,
} from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { NoProjectCodeProvided } from '../../utils/types'
import moment from 'moment'
import { randomString } from '../../utils/random'
import { expectToBeDefined } from '../../utils/util'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { twoAcceptedHakemusTest } from '../../fixtures/twoHakemusTest'
import {
  getAllMaksatuksetFromMaksatuspalvelu,
  putMaksupalauteToMaksatuspalveluAndProcessIt,
} from './maksatuspalvelu'
import { ValiselvitysPage } from '../../pages/virkailija/hakujen-hallinta/ValiselvitysPage'
import { createDefaultErapaiva } from '../../../va-virkailija/web/va/hakujen-hallinta-page/haku-details/erapaiva'

const correctOVTTest = test.extend({
  codes: async ({ page }, use) => {
    const codes = {
      operationalUnit: '6600105300',
      project: [NoProjectCodeProvided.code, '523452346'],
    }
    const koodienHallintaPage = KoodienhallintaPage(page)
    await koodienHallintaPage.createCodeValues(codes)
    await use(codes)
  },
})

const showProjectCodeTest = test.extend({
  codes: async ({ page }, use) => {
    const codes = {
      operationalUnit: '6600105300',
      project: [
        NoProjectCodeProvided.code,
        randomString().substring(0, 13),
        randomString().substring(0, 13),
        randomString().substring(0, 13),
      ],
    }
    const koodienHallintaPage = KoodienhallintaPage(page)
    await koodienHallintaPage.createCodeValues(codes)
    await use(codes)
  },
  projektikoodi: async ({ codes }, use) => {
    await use(codes.project[2])
  },
})

test.setTimeout(400000)
correctOVTTest.setTimeout(400000)
showProjectCodeTest.setTimeout(400000)

export async function getSentInvoiceFromDB(
  request: APIRequestContext,
  pitkaviite: string
): Promise<string> {
  const res = await request.post(`${VIRKAILIJA_URL}/api/test/get-sent-invoice-from-db`, {
    data: { pitkaviite },
    failOnStatusCode: true,
  })
  return await res.text()
}

const multipleInstallmentTest = test.extend({
  hakuProps: async ({ hakuProps }, use) => {
    await use({ ...hakuProps, installment: Installment.MultipleInstallments })
  },
})

const withoutDots = (tatili: string) => tatili.replaceAll('.', '')

test.describe.configure({ mode: 'parallel' })

multipleInstallmentTest(
  'Hakemus voidaan maksaa monessa erässä',
  async ({
    page,
    avustushakuID,
    avustushakuName,
    acceptedHakemus: { hakemusID },
    talousarviotili,
  }) => {
    const valiselvitysPage = ValiselvitysPage(page)

    const SECOND_INSTALLMENT = '30000'
    await test.step(`lisää toinen maksatuserä (${SECOND_INSTALLMENT} e)`, async () => {
      const valiselvitysTab = await valiselvitysPage.navigateToValiselvitysTab(
        avustushakuID,
        hakemusID
      )

      await valiselvitysTab.acceptInstallment(`${SECOND_INSTALLMENT}`)
    })

    const THIRD_INSTALLMENT = '10000'
    await test.step(`lisää kolmas maksatuserä (${THIRD_INSTALLMENT} e)`, async () => {
      const loppuselvitysTab = await valiselvitysPage.navigateToLoppuselvitysTab(
        avustushakuID,
        hakemusID
      )
      await loppuselvitysTab.acceptInstallment('10000')
    })

    const maksatuksetPage = MaksatuksetPage(page)
    await maksatuksetPage.goto(avustushakuName)

    await test.step('täytä maksuerän tiedot ja lähetä maksatukset', async () => {
      await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()
    })

    await test.step('tarkista maksuerien tiedot', async () => {
      const presenter = 'essi.esittelija@example.com'
      const acceptor = 'hygge.hyvaksyja@example.com'
      const today = (): string => {
        return moment().format('D.M.YYYY')
      }

      const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab()

      const phase1 = sentPayments(1)
      await expect.soft(phase1.amountOfPayments).toHaveText('1')
      await expect.soft(phase1.allekirjoitettuYhteenveto).toHaveText('ID0123456789')

      const phase2 = sentPayments(2)
      await expect.soft(phase2.totalSum).toHaveText('30000')
      await expect
        .soft(phase2.eraPaivamaara)
        .toHaveText(moment(createDefaultErapaiva(moment())).format('D.M.YYYY'))
      await expect.soft(phase2.presenterEmail).toHaveText(presenter)

      const phase3 = sentPayments(3)
      await expect.soft(phase3.phaseTitle).toHaveText('3. erä')
      await expect.soft(phase3.totalSum).toHaveText('10000')
      await expect.soft(phase3.laskuPaivamaara).toHaveText(today())
      await expect.soft(phase3.tositePaiva).toHaveText(today())
      await expect.soft(phase3.acceptorEmail).toHaveText(acceptor)
    })

    await test.step('tarkista lähetetyt maksatukset', async () => {
      const { 'register-number': registerNumber } =
        await getHakemusTokenAndRegisterNumber(hakemusID)
      const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab()

      const phase1 = sentPayments(1)
      await expect.soft(phase1.pitkaviite).toHaveText(`${registerNumber}_1 Erkki Esimerkki`)
      await expect.soft(phase1.tiliointi).toHaveText('59999 €')
      await expect.soft(phase1.maksuun).toHaveText('59999 €')
      await expect.soft(phase1.iban).toHaveText('FI95 6682 9530 0087 65')
      await expect.soft(phase1.paymentStatus).toHaveText('Lähetetty')

      const phase2 = sentPayments(2)
      await expect.soft(phase2.pitkaviite).toHaveText(`${registerNumber}_2 Erkki Esimerkki`)
      await expect.soft(phase2.toimittaja).toHaveText('Akaan kaupunki')
      await expect.soft(phase2.maksuun).toHaveText('30000 €')
      await expect.soft(phase2.lkpTili).toHaveText('82010000')
      await expect.soft(phase2.tiliointi).toHaveText('30000 €')

      const phase3 = sentPayments(3)
      await expect.soft(phase3.pitkaviite).toHaveText(`${registerNumber}_3 Erkki Esimerkki`)
      await expect.soft(phase3.maksuun).toHaveText('10000 €')
      await expect.soft(phase3.takpTili).toHaveText(withoutDots(talousarviotili.code))
      await expect.soft(phase3.hanke).toHaveText('Rahassa kylpijät Ky Ay Oy')
      await expect.soft(phase3.hanke).toHaveText('Rahassa kylpijät Ky Ay Oy')
      await expect.soft(phase3.tiliointi).toHaveText('10000 €')
    })
  }
)

correctOVTTest(
  'uses correct OVT when the operational unit is Palvelukeskus',
  async ({
    page,
    avustushakuName,
    acceptedHakemus: { hakemusID },
    codes: codeValues,
    talousarviotili,
  }) => {
    const maksatuksetPage = MaksatuksetPage(page)
    await maksatuksetPage.goto(avustushakuName)
    const dueDate = await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()
    await maksatuksetPage.reloadPaymentPage()

    const paymentBatches = await maksatuksetPage.clickLahetetytMaksatuksetTab()
    const { 'register-number': registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`

    await expect(paymentBatches(1).pitkaviite).toHaveText(pitkaviite)
    await expect(paymentBatches(1).paymentStatus).toHaveText('Lähetetty')
    await expect(paymentBatches(1).toimittaja).toHaveText('Akaan kaupunki')
    await expect(paymentBatches(1).hanke).toHaveText('Rahassa kylpijät Ky Ay Oy')

    const maksuun = '99999 €'
    await expect(paymentBatches(1).maksuun).toHaveText(maksuun)
    await expect(paymentBatches(1).iban).toHaveText('FI95 6682 9530 0087 65')
    await expect(paymentBatches(1).lkpTili).toHaveText('82010000')
    const tatili = withoutDots(talousarviotili.code)
    await expect(paymentBatches(1).takpTili).toHaveText(tatili)
    await expect(paymentBatches(1).tiliointi).toHaveText(maksuun)

    await putMaksupalauteToMaksatuspalveluAndProcessIt(
      page.request,
      `
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `
    )

    await maksatuksetPage.reloadPaymentPage()
    await maksatuksetPage.clickLahetetytMaksatuksetTab()
    await expect(paymentBatches(1).paymentStatus).toHaveText('Maksettu')

    const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu(page.request)

    expect(maksatukset).toContainEqual(
      maksatuksetPage.getExpectedPaymentXML({
        projekti: codeValues.project[1],
        toimintayksikko: codeValues.operationalUnit,
        pitkaviite,
        invoiceNumber: `${registerNumber}_1`,
        dueDate,
        ovt: '00372769790122',
        talousarviotili: tatili,
      })
    )
  }
)

twoAcceptedHakemusTest(
  'does not create maksatukset if should-pay is set to false',
  async ({
    page,
    avustushakuID,
    avustushakuName,
    acceptedHakemukset: { hakemusID },
    answers,
    secondAnswers,
  }) => {
    expectToBeDefined(hakemusID)
    const projectName = answers.projectName
    if (!projectName) {
      throw new Error('projectName must be set in order to select hakemus')
    }
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await test.step('set should pay to false for first hakemus', async () => {
      await hakemustenArviointiPage.selectHakemusFromList(projectName)
      await hakemustenArviointiPage.tabs().seuranta.click()
      const seuranta = hakemustenArviointiPage.seurantaTabLocators()
      await expect(seuranta.shouldPay.truthy).toBeChecked()
      await expect(seuranta.shouldPay.falsy).not.toBeChecked()
      await expect(seuranta.shouldPay.comment).toBeDisabled()
      await seuranta.shouldPay.falsy.click()
      await hakemustenArviointiPage.waitForSave()
      await expect(seuranta.shouldPay.comment).toBeEnabled()
      await seuranta.shouldPay.comment.fill('Pyörrän päätökseni')
    })
    await test.step('only second hakemus maksatukset are created as first was marked should not pay', async () => {

      const projectName = secondAnswers.projectName
      if (!projectName) {
        throw new Error('projectName must be set')
      }
      await hakemustenArviointiPage.waitForSave()
      const maksatuksetPage = MaksatuksetPage(page)
      await maksatuksetPage.goto(avustushakuName)
      const firstRowHanke = maksatuksetPage.maksatuksetTableRow(0).hanke
      await expect(firstRowHanke).toBeHidden()
      await maksatuksetPage.luoMaksatukset.click()
      await expect(firstRowHanke).toHaveText(projectName)
      await expect(maksatuksetPage.maksatuksetTableRow(1).hanke).toBeHidden()
    })
  }
)

showProjectCodeTest(
  'sends correct project code to maksatukset when there are multiple project codes for avustushaku',
  async ({
    page,
    acceptedHakemus,
    avustushakuName,
    talousarviotili,
    codes: { operationalUnit },
    projektikoodi,
  }) => {
    expectToBeDefined(acceptedHakemus)
    const maksatusPage = MaksatuksetPage(page)
    const lahtevatMaksatukset = await maksatusPage.goto(avustushakuName)
    const projectCode = `Projekti ${projektikoodi}`
    await expect(lahtevatMaksatukset.projektikoodi).toHaveText(projectCode)
    const dueDate = await maksatusPage.fillMaksueranTiedotAndSendMaksatukset()
    await maksatusPage.reloadPaymentPage()
    const lahetetytMaksatukset = await maksatusPage.clickLahetetytMaksatuksetTab()
    await expect(lahetetytMaksatukset(1).projektikoodi).toHaveText(projectCode)

    const { 'register-number': registerNumber } = await getHakemusTokenAndRegisterNumber(
      acceptedHakemus.hakemusID
    )
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`
    await putMaksupalauteToMaksatuspalveluAndProcessIt(
      page.request,
      `
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `
    )
    const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu(page.request)
    const invoiceXML = await getSentInvoiceFromDB(page.request, pitkaviite)

    const expectedXML = maksatusPage.getExpectedPaymentXML({
      projekti: projektikoodi,
      toimintayksikko: operationalUnit,
      pitkaviite,
      invoiceNumber: `${registerNumber}_1`,
      dueDate,
      ovt: '00372769790122',
      talousarviotili: withoutDots(talousarviotili.code),
    })

    expect(maksatukset).toContainEqual(expectedXML)
    expect(invoiceXML).toBe(expectedXML)
  }
)

test('sending maksatukset disables changing code values for haku', async ({
  page,
  avustushakuID,
  avustushakuName,
  acceptedHakemus: { hakemusID },
}) => {
  const maksatuksetPage = MaksatuksetPage(page)

  await maksatuksetPage.goto(avustushakuName)
  await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()
  await maksatuksetPage.reloadPaymentPage()

  const { 'register-number': registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
  const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`
  await putMaksupalauteToMaksatuspalveluAndProcessIt(
    page.request,
    `
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `
  )

  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await hakujenHallintaPage.navigate(avustushakuID)
  await expect(
    hakujenHallintaPage.page.locator('.code-value-dropdown-operational-unit-id--is-disabled')
  ).toBeVisible()

  const projects = await hakujenHallintaPage.page.locator(
    '.code-value-dropdown-project-id--is-disabled'
  )
  for (let i = 0; i < (await projects.count()); i++) {
    await expect(projects.nth(i)).toBeVisible()
  }
})
