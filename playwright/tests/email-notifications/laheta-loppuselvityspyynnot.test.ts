import { Page, test, expect } from '@playwright/test'
import { dummyPdfPath, VIRKAILIJA_URL } from '../../utils/constants'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import moment from 'moment'
import { Email, getLahetaLoppuselvityspyynnotEmails, lastOrFail } from '../../utils/emails'
import { expectToBeDefined } from '../../utils/util'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { selvitysTest } from '../../fixtures/selvitysTest'
import { navigate } from '../../utils/navigate'
import { HakijaSelvitysPage } from '../../pages/hakija/hakijaSelvitysPage'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import { LoppuselvitysPage } from '../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import muutoshakemusEnabledHakuLomakeJson from '../../fixtures/asd.hakulomake.json'

const sendLahetaLoppuselvityspyynnotNotifications = (page: Page) =>
  page.request.post(`${VIRKAILIJA_URL}/api/test/send-laheta-loppuselvityspyynnot-notifications`, {
    failOnStatusCode: true,
  })

interface LoppuselvitysExtraFixtures {
  loppuselvitysDate: string
  loppuselvitysDateSet: true
}

const notifyTest = selvitysTest.extend<LoppuselvitysExtraFixtures>({
  loppuselvitysDate: moment().format('DD.MM.YYYY'),
  loppuselvitysDateSet: async (
    { loppuselvitysDate, page, avustushakuID, acceptedHakemus },
    use
  ) => {
    expectToBeDefined(acceptedHakemus)

    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)

    await paatosPage.setLoppuselvitysDate(loppuselvitysDate)
    await paatosPage.waitForSave()
    await use(true)
  },
})

async function expectNotificationsSentAfterLahetaLoppuselvityspyynnot(
  page: Page,
  avustushakuID: number
): Promise<Email[]> {
  const emailsBefore = await getLahetaLoppuselvityspyynnotEmails(avustushakuID)
  await sendLahetaLoppuselvityspyynnotNotifications(page)
  const emailsAfter = await getLahetaLoppuselvityspyynnotEmails(avustushakuID)
  expect(
    emailsAfter.length,
    'Should have sent some Lähetä loppuselvityspyynnöt emails'
  ).toBeGreaterThan(emailsBefore.length)
  return emailsAfter
}

async function expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(
  page: Page,
  avustushakuID: number
): Promise<void> {
  const emailsBefore = await getLahetaLoppuselvityspyynnotEmails(avustushakuID)
  await sendLahetaLoppuselvityspyynnotNotifications(page)
  const emailsAfter = await getLahetaLoppuselvityspyynnotEmails(avustushakuID)
  expect(emailsAfter.length, 'Should not have sent any Lähetä loppuselvityspyynnöt emails').toEqual(
    emailsBefore.length
  )
}

async function sendLoppuselvitysEmails(page: Page, avustushakuID: number) {
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const loppuselvitysTab = await hakujenHallintaPage.navigateToLoppuselvitys(avustushakuID)
  await loppuselvitysTab.sendSelvitysPyynnot()
}

notifyTest.describe(
  'notifications are sent repeatedly until loppuselvityspyynnöt have been sent',
  () => {
    const loppuselvitysDeadline = moment().add(8, 'months').format('DD.MM.YYYY')
    notifyTest.use({ loppuselvitysDate: loppuselvitysDeadline })
    notifyTest(
      'loppuselvitys notification is sent repeatedly',
      async ({ page, loppuselvitysDateSet, avustushakuID }) => {
        expect(loppuselvitysDateSet)
        await expectNotificationsSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
        await sendLoppuselvitysEmails(page, avustushakuID)
        await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
      }
    )
  }
)

notifyTest(
  'if hakemus has been refused notification is not send',
  async ({ page, answers, acceptedHakemus, avustushakuID, loppuselvitysDateSet }) => {
    expect(acceptedHakemus).toBeDefined()
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)

    await hakemustenArviointiPage.tabs().seuranta.click()

    await page.click('[data-test-id="keskeyta-aloittamatta"]')

    await hakemustenArviointiPage.waitForSave()
    expect(loppuselvitysDateSet)
    await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
  }
)

notifyTest.describe('when loppuselvitys deadline is in the past', () => {
  notifyTest.use({
    loppuselvitysDate: moment().subtract(1, 'day').format('DD.MM.YYYY'),
  })
  notifyTest('notification is not send', async ({ page, loppuselvitysDateSet, avustushakuID }) => {
    expect(loppuselvitysDateSet)
    await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
  })
})

notifyTest.describe('when over 8 months till loppuselvitys deadline', () => {
  notifyTest.use({
    loppuselvitysDate: moment().add(12, 'months').format('DD.MM.YYYY'),
  })
  notifyTest('notification is not send', async ({ page, loppuselvitysDateSet, avustushakuID }) => {
    expect(loppuselvitysDateSet)
    await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
  })
})

notifyTest.describe('8 months till loppuselvitys deadline', () => {
  const loppuselvitysDeadline = moment().add(8, 'months').format('DD.MM.YYYY')
  notifyTest.use({ loppuselvitysDate: loppuselvitysDeadline })
  notifyTest(
    'notification is sent',
    async ({ page, loppuselvitysDateSet, avustushakuID, hakuProps }) => {
      expect(loppuselvitysDateSet)
      const emailsAfter = await expectNotificationsSentAfterLahetaLoppuselvityspyynnot(
        page,
        avustushakuID
      )
      await test.step('email content is correct', async () => {
        const email = lastOrFail(emailsAfter)
        expect(email['to-address']).toHaveLength(2)
        expect(email['to-address']).toContain('santeri.horttanainen@reaktor.com')
        expect(email['to-address']).toContain('viivi.virkailja@exmaple.com')
        expect(email.subject).toEqual('Muistutus loppuselvityspyyntöjen lähettämisestä')
        expect(email.formatted).toEqual(`Hyvä vastaanottaja,

valtionavustuksen ${hakuProps.avustushakuName} loppuselvitysten palautuksen määräaika on ${loppuselvitysDeadline}.

Laatikaa vastuuvalmistelijan johdolla loppuselvityslomake ja lähettäkää loppuselvityspyynnöt avustuksen saajille mahdollisimman pian.

Ohjeet loppuselvityslomakkeen laatimiseksi ja selvityspyyntöjen lähettämiseksi löytyvät: https://intra.oph.fi/pages/viewpage.action?spaceKey=VALA&title=Loppuselvitykset

Huomatkaa, että valtionavustusjärjestelmä lähettää automaattisesti muistutusviestin loppuselvityksen palauttamisesta kaikille niille avustuksen saajille, jotka eivät ole lähettäneet loppuselvitystä käsiteltäväksi viimeistään kaksi viikkoa ennen palautuksen määräpäivää.

Ongelmatilanteissa saat apua osoitteesta: va-tuki@oph.fi
`)
      })
      await test.step('notification is not sent again if loppupäätös is sent', async () => {
        await sendLoppuselvitysEmails(page, avustushakuID)
        await sendLahetaLoppuselvityspyynnotNotifications(page)
        const emailsAfterSendingLoppuselvitys =
          await getLahetaLoppuselvityspyynnotEmails(avustushakuID)
        expect(emailsAfter.length).toEqual(emailsAfterSendingLoppuselvitys.length)
      })
    }
  )
})

selvitysTest.describe('when sending päätös', async () => {
  selvitysTest(
    'send the notification only after sending päätös',
    async ({
      closedAvustushaku,
      page,
      avustushakuID,
      answers,
      ukotettuValmistelija,
      projektikoodi,
    }) => {
      expectToBeDefined(closedAvustushaku)
      await test.step('set loppuselvitys date', async () => {
        const paatosPage = PaatosPage(page)
        await paatosPage.navigateTo(avustushakuID)
        await paatosPage.setLoppuselvitysDate(moment().add(3, 'months').format('DD.MM.YYYY'))
        await paatosPage.waitForSave()
      })

      await test.step('make sure notifications are not send before päätös', async () => {
        await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
      })

      await test.step('send päätös', async () => {
        const hakemustenArviointiPage = new HakemustenArviointiPage(page)
        await hakemustenArviointiPage.navigate(avustushakuID)
        const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
          avustushakuID,
          projectName: answers.projectName,
          projektikoodi,
        })

        const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
        await haunTiedotPage.resolveAvustushaku()

        await hakemustenArviointiPage.navigate(avustushakuID)
        await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)

        const paatosPage = PaatosPage(page)
        await paatosPage.navigateTo(avustushakuID)
        await paatosPage.sendPaatos()
      })

      await expectNotificationsSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
    }
  )
})

const koiraTEsti = selvitysTest.extend({
  hakulomake: async ({}, use) => await use(JSON.stringify(muutoshakemusEnabledHakuLomakeJson)),
})
koiraTEsti.describe('when sending päätös without project name', async () => {
  selvitysTest(
    'Päätös without project name',
    async ({
      closedAvustushaku,
      page,
      avustushakuID,
      answers,
      ukotettuValmistelija,
      projektikoodi,
    }) => {
      expectToBeDefined(closedAvustushaku)
      await test.step('set loppuselvitys date', async () => {
        const paatosPage = PaatosPage(page)
        await paatosPage.navigateTo(avustushakuID)
        await paatosPage.setLoppuselvitysDate(moment().add(3, 'months').format('DD.MM.YYYY'))
        await paatosPage.waitForSave()
      })

      await test.step('make sure notifications are not send before päätös', async () => {
        await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
      })

      await test.step('send päätös', async () => {
        const hakemustenArviointiPage = new HakemustenArviointiPage(page)
        await hakemustenArviointiPage.navigate(avustushakuID)
        const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
          avustushakuID,
          projectName: answers.projectName,
          projektikoodi,
        })

        const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
        await haunTiedotPage.resolveAvustushaku()

        await hakemustenArviointiPage.navigate(avustushakuID)
        await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)

        const paatosPage = PaatosPage(page)
        await paatosPage.navigateTo(avustushakuID)
        await paatosPage.sendPaatos()
      })

      await expectNotificationsSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
    }
  )
})

notifyTest(
  'notification not sent if loppuselvitys is already submitted',
  async ({ page, avustushakuID, loppuselvitysDateSet, acceptedHakemus }) => {
    expectToBeDefined(loppuselvitysDateSet)

    await test.step('submit loppuselvitys', async () => {
      const loppuselvitysPage = LoppuselvitysPage(page)
      await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, acceptedHakemus.hakemusID)
      const loppuselvitysFormUrl = await loppuselvitysPage.getSelvitysFormUrl()

      await navigate(page, loppuselvitysFormUrl)
      const hakijaSelvitysPage = HakijaSelvitysPage(page)

      await hakijaSelvitysPage.textArea(0).fill('Yhteenveto')
      await hakijaSelvitysPage.textArea(2).fill('Työn jako')
      await hakijaSelvitysPage.projectGoal.fill('Tavoite')
      await hakijaSelvitysPage.projectActivity.fill('Toiminta')
      await hakijaSelvitysPage.projectResult.fill('Tulokset')
      await hakijaSelvitysPage.textArea(1).fill('Arviointi')
      await hakijaSelvitysPage.textArea(3).fill('Tiedotus')

      await hakijaSelvitysPage.outcomeTypeRadioButtons.operatingModel.click()
      await hakijaSelvitysPage.outcomeDescription.fill('Kuvaus')
      await hakijaSelvitysPage.outcomeAddress.fill('Saatavuustiedot')

      await hakijaSelvitysPage.goodPracticesRadioButtons.no.click()
      await hakijaSelvitysPage.textArea(4).fill('Lisätietoja')

      await hakijaSelvitysPage.firstAttachment.setInputFiles(dummyPdfPath)

      await expect(hakijaSelvitysPage.submitButton).toHaveText('Lähetä käsiteltäväksi')
      await hakijaSelvitysPage.submitButton.click()
      await expect(hakijaSelvitysPage.submitButton).toHaveText('Loppuselvitys lähetetty')
      await hakijaSelvitysPage.submitButton.isDisabled()
    })

    await test.step('should not send any notifications', async () => {
      await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(page, avustushakuID)
    })
  }
)
