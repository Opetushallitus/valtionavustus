import { APIRequestContext, expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { getHakemusTokenAndRegisterNumber } from '../../utils/emails'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { MaksatuksetPage } from '../../pages/virkailija/hakujen-hallinta/maksatuksetPage'
import {
  getAllMaksatuksetFromMaksatuspalvelu,
  putMaksupalauteToMaksatuspalveluAndProcessIt,
} from './maksatuspalvelu'

test.setTimeout(400000)

const withoutDots = (tatili: string) => tatili.replaceAll('.', '')

async function removeStoredPitkäviiteFromAllAvustushakuPayments(
  request: APIRequestContext,
  avustushakuId: number
): Promise<void> {
  await request.post(
    `${VIRKAILIJA_URL}/api/test/remove-stored-pitkaviite-from-all-avustushaku-payments`,
    { data: { avustushakuId }, failOnStatusCode: true }
  )
}

test.describe('maksatukset pitkaviite', async () => {
  test('work with pitkaviite without contact person name', async ({
    page,
    avustushakuID,
    avustushakuName,
    acceptedHakemus: { hakemusID },
    talousarviotili,
  }) => {
    const maksatuksetPage = MaksatuksetPage(page)
    await maksatuksetPage.goto(avustushakuName)

    await maksatuksetPage.fillInMaksueranTiedot(
      'ID0123456789',
      'essi.esittelija@example.com',
      'hygge.hyvaksyja@example.com'
    )

    await maksatuksetPage.sendMaksatukset()

    await removeStoredPitkäviiteFromAllAvustushakuPayments(page.request, avustushakuID)
    await maksatuksetPage.reloadPaymentPage()

    const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab()
    const { 'register-number': registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const pitkaviite = registerNumber

    await expect(sentPayments(1).pitkaviite).toHaveText(pitkaviite)
    await expect(sentPayments(1).paymentStatus).toHaveText('Lähetetty')
    await expect(sentPayments(1).toimittaja).toHaveText('Akaan kaupunki')
    await expect(sentPayments(1).hanke).toHaveText('Rahassa kylpijät Ky Ay Oy')

    const maksuun = '99999 €'
    await expect(sentPayments(1).maksuun).toHaveText(maksuun)
    await expect(sentPayments(1).iban).toHaveText('FI95 6682 9530 0087 65')
    await expect(sentPayments(1).lkpTili).toHaveText('82010000')
    await expect(sentPayments(1).takpTili).toHaveText(withoutDots(talousarviotili.code))
    await expect(sentPayments(1).tiliointi).toHaveText(maksuun)

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
    await expect(sentPayments(1).paymentStatus).toHaveText('Maksettu')
  })
  test('work with pitkaviite with contact person name', async ({
    page,
    avustushakuName,
    acceptedHakemus: { hakemusID },
    codes: { operationalUnit },
    projektikoodi,
    talousarviotili,
  }) => {
    const maksatuksetPage = MaksatuksetPage(page)
    await maksatuksetPage.goto(avustushakuName)
    const dueDate = await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()
    await maksatuksetPage.reloadPaymentPage()

    const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab()
    const { 'register-number': registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`

    await expect(sentPayments(1).pitkaviite).toHaveText(pitkaviite)
    await expect(sentPayments(1).paymentStatus).toHaveText('Lähetetty')
    await expect(sentPayments(1).toimittaja).toHaveText('Akaan kaupunki')
    await expect(sentPayments(1).hanke).toHaveText('Rahassa kylpijät Ky Ay Oy')
    const maksuun = '99999 €'
    await expect(sentPayments(1).maksuun).toHaveText(maksuun)
    await expect(sentPayments(1).iban).toHaveText('FI95 6682 9530 0087 65')
    await expect(sentPayments(1).lkpTili).toHaveText('82010000')
    const tatili = withoutDots(talousarviotili.code)
    await expect(sentPayments(1).takpTili).toHaveText(tatili)
    await expect(sentPayments(1).tiliointi).toHaveText(maksuun)

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
    const sentPaymentsAfterMaksupalaute = await maksatuksetPage.clickLahetetytMaksatuksetTab()
    const statuses = sentPaymentsAfterMaksupalaute(1)
    await expect(statuses.paymentStatus).toHaveText('Maksettu')

    const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu(page.request)
    expect(maksatukset).toContainEqual(
      maksatuksetPage.getExpectedPaymentXML({
        projekti: projektikoodi,
        toimintayksikko: operationalUnit,
        pitkaviite,
        invoiceNumber: `${registerNumber}_1`,
        dueDate,
        talousarviotili: tatili,
      })
    )
  })
})
