import { test, expect, Page } from '@playwright/test'
import moment from 'moment'

import { VIRKAILIJA_URL } from '../../utils/constants'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { getLahetaValiselvityspyynnotEmails } from '../../utils/emails'
import { expectToBeDefined } from '../../utils/util'
import { selvitysTest } from '../../fixtures/selvitysTest'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'

selvitysTest.describe.configure({ mode: 'parallel' })

selvitysTest.describe('Lähetä väliselvityspyynnöt notifications', () => {
  selvitysTest(
    'Lähetä väliselvityspyynnot notifications are not sent if väliselvitys deadline is not set',
    async ({ page, avustushakuID, acceptedHakemus }) => {
      expectToBeDefined(acceptedHakemus)

      const emailsBefore = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )

  selvitysTest(
    'Lähetä väliselvityspyynnöt notifications are not sent if valiselvitys deadline is more than 6 months in the future',
    async ({ page, avustushakuID, acceptedHakemus }) => {
      expectToBeDefined(acceptedHakemus)
      const valiselvitysdate = moment().add(7, 'months').format('DD.MM.YYYY')

      await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

      const emailsBefore = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )

  selvitysTest(
    'Lähetä väliselvityspyynnöt notifications are not sent if valiselvitys deadline is in the past',
    async ({ page, avustushakuID, acceptedHakemus }) => {
      expectToBeDefined(acceptedHakemus)
      const valiselvitysdate = moment().subtract(1, 'day').format('DD.MM.YYYY')

      await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

      const emailsBefore = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )

  selvitysTest(
    'Lähetä väliselvityspyynnöt notifications are send 6 months before valiselvitys deadline',
    async ({ page, avustushakuID, acceptedHakemus }) => {
      expectToBeDefined(acceptedHakemus)
      const valiselvitysdate = moment().add(6, 'months').format('DD.MM.YYYY')
      await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

      const emailsBefore = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter.length).toBeGreaterThan(emailsBefore.length)
    }
  )

  selvitysTest(
    'Lähetä väliselvityspyynnöt notifications are send after paatos has been send',
    async ({
      closedAvustushaku,
      avustushakuID,
      answers,
      page,
      ukotettuValmistelija,
      projektikoodi,
    }) => {
      expectToBeDefined(closedAvustushaku)

      await test.step('ensure notifications are not send before paatos has been send', async () => {
        const valiselvitysdate = moment().add(5, 'months').format('DD.MM.YYYY')
        await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

        const emailsBefore = await getLahetaValiselvityspyynnotEmails(avustushakuID)
        await sendLahetaValiselvityspyynnotNotifications(page)

        const emailsAfter = await getLahetaValiselvityspyynnotEmails(avustushakuID)
        expect(emailsAfter).toEqual(emailsBefore)
      })

      await test.step('send paatos', async () => {
        const projectName = answers.projectName
        if (!projectName) {
          throw new Error('projectName must be set in order to accept avustushaku')
        }
        const hakemustenArviointiPage = new HakemustenArviointiPage(page)
        await hakemustenArviointiPage.navigate(avustushakuID)
        const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
          avustushakuID,
          projectName,
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

      const emailsBefore = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter.length).toBeGreaterThan(emailsBefore.length)
    }
  )

  selvitysTest(
    'Lähetä väliselvityspyynnöt notifications are not sent if väliselvityspyyntö has been sent',
    async ({ page, avustushakuID, väliselvityspyyntöSent }) => {
      expectToBeDefined(väliselvityspyyntöSent)

      const valiselvitysdate = moment().add(5, 'months').format('DD.MM.YYYY')
      await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

      const emailsBefore = await getLahetaValiselvityspyynnotEmails(avustushakuID)

      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )

  selvitysTest(
    'Lähetä väliselvityspyynnöt notifications are sent until väliselvityspyynnöt have been sent',
    async ({ page, avustushakuID, acceptedHakemus }) => {
      expectToBeDefined(acceptedHakemus)
      const valiselvitysdate = moment().add(6, 'months').format('DD.MM.YYYY')
      await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

      const emailsBefore = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter.length).toBeGreaterThan(emailsBefore.length)

      const emailsBefore2 = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter2 = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter2.length).toBeGreaterThan(emailsBefore2.length)

      const hakujenHallinta = new HakujenHallintaPage(page)
      const valiselvitysPage = await hakujenHallinta.navigateToValiselvitys(avustushakuID)
      await Promise.all([
        page.waitForResponse(
          `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/send-notification`
        ),
        valiselvitysPage.sendValiselvitys(),
      ])

      const emailsBefore3 = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter3 = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter3).toEqual(emailsBefore3)
    }
  )
})

const sendLahetaValiselvityspyynnotNotifications = (page: Page) =>
  page.request.post(`${VIRKAILIJA_URL}/api/test/send-laheta-valiselvityspyynnot-notifications`, {
    failOnStatusCode: true,
  })

async function setValiselvitysDate(page: Page, avustushakuID: number, value: string) {
  const paatosPage = PaatosPage(page)
  await paatosPage.navigateTo(avustushakuID)
  await paatosPage.setValiselvitysDate(value)
  await paatosPage.waitForSave()
}
