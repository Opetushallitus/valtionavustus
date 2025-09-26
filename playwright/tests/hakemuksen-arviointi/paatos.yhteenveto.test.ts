import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { getPaatoksetLahetettyEmails, lastOrFail, waitUntilMinEmails } from '../../utils/emails'
import { expect, Page } from '@playwright/test'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { expectToBeDefined } from '../../utils/util'
import { YhteenvetoPage } from '../../pages/virkailija/yhteenvetoPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'

const getSearchUrl = async ({
  page,
  avustushakuID,
  hakemusIds,
}: {
  page: Page
  avustushakuID: number
  hakemusIds: number[]
}) => {
  const res = await page.request.put(
    `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/searches`,
    {
      data: { 'hakemus-ids': hakemusIds },
    }
  )
  const json = await res.json()
  const searchUrl = json['search-url']
  expectToBeDefined(searchUrl)
  return searchUrl
}

const pyorijatAnswers = {
  contactPersonEmail: 'ville.aaltonen@reaktor.com',
  contactPersonName: 'Ville Aaltonen',
  contactPersonPhoneNumber: '12345',
  projectName: 'Rahassa pyörijät Ky Ay Oy',
}

const test = muutoshakemusTest.extend<{
  yhteenveto: { hakemusIds: number[]; userKey: string }
}>({
  submittedHakemus: async ({ avustushakuID, answers, page }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)

    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(
      avustushakuID,
      pyorijatAnswers
    )

    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const { userKey } = await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(
      avustushakuID,
      answers
    )
    await use({ userKey })
  },
  yhteenveto: async (
    {
      closedAvustushaku,
      page,
      ukotettuValmistelija,
      submittedHakemus: { userKey },
      answers,
      projektikoodi,
    },
    use,
    testInfo
  ) => {
    const avustushakuID = closedAvustushaku.id
    testInfo.setTimeout(testInfo.timeout + 50_000)

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    const hakemusID1 = await hakemustenArviointiPage.acceptAvustushaku({
      avustushakuID,
      projectName: pyorijatAnswers.projectName,
      budget: '10000',
      projektikoodi,
    })
    await hakemustenArviointiPage.page.click('#close-hakemus-button')
    const hakemusID2 = await hakemustenArviointiPage.acceptAvustushaku({
      avustushakuID,
      projectName: answers.projectName,
      budget: '100000',
      projektikoodi,
    })

    const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
    await haunTiedotPage.resolveAvustushaku()

    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID1, ukotettuValmistelija)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID2, ukotettuValmistelija)

    await use({ hakemusIds: [hakemusID1, hakemusID2], userKey })
  },
})

const appliedAmount1 = '13884130'
const appliedAmount2 = '6942065'

test('Yhteenveto', async ({
  page,
  avustushakuID,
  hakuProps,
  yhteenveto: { hakemusIds },
  answers,
}) => {
  const yhteenvetoPage = new YhteenvetoPage(page)
  const { avustushakuName } = hakuProps
  await test.step('sending päätökset', async () => {
    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.sendPaatos(2)
  })
  await test.step('virkailija gets päätökset lähetetty email with link to päätöslista', async () => {
    const emails = await waitUntilMinEmails(getPaatoksetLahetettyEmails, 1, avustushakuID)
    const searchUrl = await getSearchUrl({ page, hakemusIds, avustushakuID })
    expect(emails).toHaveLength(1)
    const email = lastOrFail(emails)
    expect(email['to-address']).toEqual([
      'santeri.horttanainen@reaktor.com',
      'viivi.virkailja@exmaple.com',
    ])
    expect(email.subject).toEqual('Avustuspäätökset on lähetetty')
    expect(email.formatted).toEqual(`Hyvä vastaanottaja,

valtionavustuksen ${avustushakuName} päätökset on lähetetty kaikkien hakijoiden yhteyshenkilöille sekä hakijoiden virallisiin sähköpostiosoitteisiin.

Linkki valtionavustuksen päätöslistaan: ${VIRKAILIJA_URL}${searchUrl}

Avustuksen päätökset tulee julkaista oph.fi-verkkopalvelussa ohjeistuksen mukaisesti https://intra.oph.fi/pages/viewpage.action?pageId=99516838

Avustusten maksatukset toteutetaan päätöksessä kuvatun aikataulun mukaan. Ohjeet maksatusten tekemiseksi löytyvät: https://intra.oph.fi/display/VALA/Avustusten+maksaminen

Ongelmatilanteissa saat apua osoitteesta: va-tuki@oph.fi
`)
    await test.step('navigates to päätöslista', async () => {
      await yhteenvetoPage.navigate(searchUrl)
      await expect(yhteenvetoPage.page.getByText('Päätöslista')).toBeVisible()
    })
  })
  await test.step('displays title', async () => {
    expect(await yhteenvetoPage.title()).toContain(avustushakuName)
  })
  await test.step('heading summary', async () => {
    await test.step('accepted summary is correct', async () => {
      const { title, amount, appliedAmount, grantedAmount } =
        await yhteenvetoPage.summaryHeadingRowFor('accepted')
      expect(title).toEqual('Myönteiset päätökset')
      expect(amount).toEqual('2')
      expect(appliedAmount).toEqual(appliedAmount1)
      expect(grantedAmount).toEqual('109998')
    })
    await test.step('combined summary is correct', async () => {
      const { title, amount, appliedAmount, grantedAmount } =
        await yhteenvetoPage.summaryHeadingRowFor('combined')
      expect(title).toEqual('Yhteensä')
      expect(amount).toEqual('2')
      expect(appliedAmount).toEqual(appliedAmount1)
      expect(grantedAmount).toEqual('109998')
    })
  })
  await test.step('accepted summary table', async () => {
    await test.step('heading is correct', async () => {
      const head = await yhteenvetoPage.summaryTableHeadingFor('accepted')
      expect(head).toEqual('Myönteiset päätökset (2)')
    })
    const [hakemusId1, hakemusId2] = hakemusIds
    await test.step('1st hakemus is correct', async () => {
      expectToBeDefined(hakemusId1)
      const row = await yhteenvetoPage.summaryTableRowForHakemus('accepted', hakemusId1)
      const { organization, project, appliedAmount, grantedAmount, comment } = row
      expect(organization).toEqual('Akaan kaupunki')
      expect(project).toEqual(pyorijatAnswers.projectName)
      expect(appliedAmount).toEqual(appliedAmount2)
      expect(grantedAmount).toEqual('9999')
      expect(comment).toEqual('')
    })
    await test.step('2nd hakemus is correct', async () => {
      expectToBeDefined(hakemusId2)
      const row = await yhteenvetoPage.summaryTableRowForHakemus('accepted', hakemusId2)
      const { organization, project, appliedAmount, grantedAmount, comment } = row
      expect(organization).toEqual('Akaan kaupunki')
      expect(project).toEqual(answers.projectName)
      expect(appliedAmount).toEqual(appliedAmount2)
      expect(grantedAmount).toEqual('99999')
      expect(comment).toEqual('')
    })
    await test.step('summary is correct', async () => {
      const { totalAppliedAmount, totalGrantedAmount } =
        await yhteenvetoPage.summaryTableSummaryRow('accepted')
      expect(totalAppliedAmount).toEqual(appliedAmount1)
      expect(totalGrantedAmount).toEqual('109998')
    })
  })
})
