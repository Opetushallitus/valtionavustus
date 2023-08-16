import { expect, test } from '@playwright/test'
import { expectToBeDefined, waitForNewTab } from '../../utils/util'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'

import {
  getHakemusTokenAndRegisterNumber,
  getValiselvitysEmails,
  getValiselvitysSubmittedNotificationEmails,
  lastOrFail,
} from '../../utils/emails'
import { HAKIJA_URL } from '../../utils/constants'
import { HakijaSelvitysPage } from '../../pages/hakijaSelvitysPage'
import { selvitysTest } from '../../fixtures/selvitysTest'
import { HakujenHallintaPage } from '../../pages/hakujenHallintaPage'
import { ValiselvitysPage } from '../../pages/hakujen-hallinta/ValiselvitysPage'

test.describe('Väliselvitys', () => {
  selvitysTest(
    'väliselvitys submitted notification is sent',
    async ({ page, acceptedHakemus: { hakemusID }, väliselvitysSubmitted }) => {
      expectToBeDefined(väliselvitysSubmitted)
      const email = lastOrFail(await getValiselvitysSubmittedNotificationEmails(hakemusID))
      expect(email['to-address']).toHaveLength(1)
      expect(email['to-address']).toEqual(['erkki.esimerkki@example.com'])
      expect(email.subject).toEqual('Väliselvityksenne on vastaanotettu')
      const { 'register-number': registerNumber } =
        await getHakemusTokenAndRegisterNumber(hakemusID)
      expect(email.formatted).toContain(`Hyvä vastaanottaja,

olemme vastaanottaneet väliselvityksenne.

Rahassa kylpijät Ky Ay Oy
${registerNumber}
`)
      expect(email.formatted).toContain(`
Voitte muokata jo lähetettyä selvitystä alkuperäisessä selvityspyynnössä olevan lomakelinkin kautta selvityksen määräaikaan saakka. Tällöin selvitystä ei kuitenkaan enää lähetetä uudelleen käsiteltäväksi, vaan muokkausten tallentuminen varmistetaan lomakkeen yläreunan lokitietokentästä.

Lisätietoja saatte tarvittaessa avustuspäätöksessä mainitulta lisätietojen antajalta. Teknisissä ongelmissa auttaa: valtionavustukset@oph.fi

Kun selvitys on käsitelty, ilmoitetaan siitä sähköpostitse avustuksen saajan viralliseen sähköpostiosoitteeseen sekä yhteyshenkilölle.`)

      const previewUrl = email.formatted.match(/(https?:\/\/\S+)/gi)?.[0]
      if (!previewUrl) {
        throw new Error('No preview url found')
      }

      await page.goto(previewUrl)
      await expect(page.locator('div.soresu-preview > h1')).toContainText(
        'väliselvitys submitted notification is sent'
      )
      await expect(page.locator('#organization > div')).toContainText('Avustuksen saajan nimi')
    }
  )

  selvitysTest(
    'väliselvitys can be accepted',
    async ({
      context,
      page,
      avustushakuID,
      acceptedHakemus,
      väliselvitysSubmitted: { userKey },
    }) => {
      const arviointi = new HakemustenArviointiPage(page)

      await test.step('väliselvitys is tarkastamatta', async () => {
        await arviointi.navigate(avustushakuID)
        await expect(arviointi.getVäliselvitysStatus(acceptedHakemus.hakemusID)).toHaveText(
          'Tarkastamatta'
        )
      })

      const valiselvitysPage = ValiselvitysPage(page)
      await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, acceptedHakemus.hakemusID)
      await test.step('hakija could still edit väliselvitys', async () => {
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          valiselvitysPage.linkToHakemus.click(),
        ])
        const hakijaSelvitysPage = HakijaSelvitysPage(newPage)
        await expect(hakijaSelvitysPage.submitButton).toBeDisabled()
        await expect(hakijaSelvitysPage.submitButton).toHaveText('Väliselvitys lähetetty')
        await expect(hakijaSelvitysPage.valiselvitysWarning).toBeHidden()
        await hakijaSelvitysPage.page.close()
      })

      await test.step('tarkasta väliselvitys', async () => {
        await expect(page.getByTestId('selvitys-email')).toBeVisible()
        await valiselvitysPage.acceptSelvitys()
      })

      await test.step('väliselvitys accepted email is sent to primary and organization emails', async () => {
        const emails = await getValiselvitysEmails(acceptedHakemus.hakemusID)
        const expected = ['erkki.esimerkki@example.com', 'akaan.kaupunki@akaa.fi']
        expect(emails[0]['to-address'].every((addr) => expected.includes(addr))).toBeTruthy()
      })

      await test.step('väliselvitys no longer editable', async () => {
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          valiselvitysPage.linkToHakemus.click(),
        ])
        const hakijaSelvitysPage = HakijaSelvitysPage(newPage)
        await expect(hakijaSelvitysPage.valiselvitysWarning).toBeVisible()
        await expect(hakijaSelvitysPage.submitButton).toBeHidden()
        await hakijaSelvitysPage.page.close()
      })

      await test.step('väliselvitys is hyväksytty', async () => {
        await arviointi.navigate(avustushakuID)
        await expect(arviointi.getVäliselvitysStatus(acceptedHakemus.hakemusID)).toHaveText(
          'Hyväksytty'
        )
      })

      await test.step(`väliselvitys can't be updated using the API`, async () => {
        const getSelvitys = await page.request.get(
          `${HAKIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/${userKey}`
        )
        const selvitys = await getSelvitys.json()
        const postSelvitysContent = await page.request.post(
          `${HAKIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/${userKey}/${selvitys.version}`,
          {
            data: { value: [] },
          }
        )
        expect(postSelvitysContent.status()).toEqual(403)
      })
    }
  )
  selvitysTest(
    'väliselvitys cannot be edited after it has been accepted',
    async ({ context, page, avustushakuID, acceptedHakemus, väliselvitysSubmitted }) => {
      expectToBeDefined(väliselvitysSubmitted)
      const valiselvitysPage = ValiselvitysPage(page)
      await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, acceptedHakemus.hakemusID)
      await valiselvitysPage.acceptSelvitys()
      const valiselvitysFormUrl = await valiselvitysPage.linkToHakemus.getAttribute('href')
      if (!valiselvitysFormUrl) throw Error('väliselvitys form url not found')
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        valiselvitysPage.linkToHakemus.click(),
      ])
      const hakijaSelvitysPage = HakijaSelvitysPage(newPage)
      await expect(hakijaSelvitysPage.valiselvitysWarning).toBeVisible()
      await expect(newPage.getByTestId('form-preview')).toBeVisible()
    }
  )
})

selvitysTest(
  'Valiselvitys tab in hakemuksen arviointi should have link to hakemus form',
  async ({ page, avustushakuID, acceptedHakemus: { hakemusID } }) => {
    const valiselvitysPage = ValiselvitysPage(page)
    await test.step('warning is shown before sending loppuselvitykset', async () => {
      await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, hakemusID)
      await expect(valiselvitysPage.warning).toBeVisible()
    })
    await test.step('send väliselvitykset', async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      const valiselvitysPage = await hakujenHallintaPage.navigateToValiselvitys(avustushakuID)
      await valiselvitysPage.sendValiselvitys()
    })
    await test.step('warhing is hidden, link and lomake work', async () => {
      await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, hakemusID)
      await expect(valiselvitysPage.warning).toBeHidden()
      const [valiselvitysFormPage] = await Promise.all([
        waitForNewTab(page),
        valiselvitysPage.linkToHakemus.click(),
      ])
      await valiselvitysFormPage.waitForNavigation()
      await expect(valiselvitysFormPage.locator('h1').locator('text="Väliselvitys"')).toBeVisible()
      await expect(
        valiselvitysFormPage.locator('button', {
          hasText: 'Lähetä käsiteltäväksi',
        })
      ).toBeVisible()
    })
  }
)
