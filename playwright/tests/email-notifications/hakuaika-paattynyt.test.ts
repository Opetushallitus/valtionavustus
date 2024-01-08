import { test, expect, Page } from '@playwright/test'
import moment from 'moment'

import { getAvustushakuEmails, getLastAvustushakuEmail } from '../../utils/emails'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { MuutoshakemusFixtures, muutoshakemusTest } from '../../fixtures/muutoshakemusTest'

muutoshakemusTest.extend<Pick<MuutoshakemusFixtures, 'finalAvustushakuEndDate'>>({
  finalAvustushakuEndDate: moment().subtract(1, 'day').startOf('day'),
})(
  'notify all valmistelijas assigned to avustushaku the day after hakuaika ended',
  async ({ page, hakuProps, closedAvustushaku }) => {
    await sendHakuaikaPaattynytNotifications(page)
    const email = await getLastAvustushakuEmail(closedAvustushaku.id, 'hakuaika-paattynyt')
    expect(email).toBeDefined()

    await test.step('notification is not sent to arvioija', async () => {
      expect(email['to-address']).not.toContain('paivi.paakayttaja@example.com')
    })

    await test.step('notificaiton is sent to valmistelijas', async () => {
      expect(email['to-address']).toHaveLength(2)
      expect(email['to-address']).toContain('santeri.horttanainen@reaktor.com')
      expect(email['to-address']).toContain('viivi.virkailja@exmaple.com')
    })

    expect(email.subject).toEqual('Hakuaika on päättynyt')
    expect(email.formatted).toEqual(`Hyvä vastaanottaja,

olette saaneet hakuun ${hakuProps.avustushakuName} yhteensä 1 hakemusta, joiden yhteenlaskettu haettu avustussumma on 6942065 euroa.

Voitte aloittaa hakemusten arvioinnin. Ohjeet hakemusten arviointiin (https://intra.oph.fi/display/VALA/Hakemusten+arviointi) ja päätösten laatimiseen (https://intra.oph.fi/pages/viewpage.action?pageId=99516838) löytyvät OSSIsta.

Ongelmatilanteissa saat apua osoitteesta: va-tuki@oph.fi
`)
  }
)
muutoshakemusTest.extend<Pick<MuutoshakemusFixtures, 'finalAvustushakuEndDate'>>({
  finalAvustushakuEndDate: moment().subtract(7, 'day').startOf('day'),
})('do not notify after the first day of hakuaika ending', async ({ page, closedAvustushaku }) => {
  await sendHakuaikaPaattynytNotifications(page)
  const emails = await getAvustushakuEmails(closedAvustushaku.id, 'hakuaika-paattynyt')
  expect(emails).toHaveLength(0)
})

const sendHakuaikaPaattynytNotifications = (page: Page) =>
  page.request.post(`${VIRKAILIJA_URL}/api/test/send-hakuaika-paattynyt-notifications`, {
    failOnStatusCode: true,
  })
