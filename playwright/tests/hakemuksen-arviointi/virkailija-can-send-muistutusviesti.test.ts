import { clearAndType } from '../../utils/util'
import { selvitysTest as test } from '../../fixtures/selvitysTest'
import SelvitysTab from '../../pages/hakujen-hallinta/CommonSelvitysPage'

test('virkailija can send muistutusviesti', async ({
  page,
  acceptedHakemus: { hakemusID },
  avustushakuID,
}) => {
  const subject = 'Akaan kaupungin loppuselvitys muistutus'
  const content = 'Hei! Muistattehan täyttää kaikki kentät?'
  const additionalReceiver = 'karri@kojootti.dog'

  await test.step('virkailija can fill muistutusviesti form', async () => {
    SelvitysTab(page, 'loppu').navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    await page.getByRole('button', { name: 'Kirjoita' }).click()
    await page.click('[data-test-id="muistutusviesti-add-receiver"]')
    await clearAndType(page, '[data-test-id="muistutusviesti-receiver-1"]', additionalReceiver)

    await clearAndType(page, '[data-test-id="muistutusviesti-email-subject"]', subject)
    await clearAndType(page, '[data-test-id="muistutusviesti-email-content"]', content)
    await page.getByRole('button', { name: 'Lähetä muistutusviesti' }).click()
  })
})
