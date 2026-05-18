import { expect } from '@playwright/test'
import { selvitysTest } from '../../../fixtures/selvitysTest'
import { HakujenHallintaPage } from '../../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { VIRKAILIJA_URL } from '../../../utils/constants'

selvitysTest.describe('Otantatarkastus backwards-compat', () => {
  selvitysTest(
    'toggling otantamalli ON retroactively draws otantapolku for already-submitted loppuselvitys',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvitysSubmitted }) => {
      expect(loppuselvitysSubmitted).toBeDefined()

      const hakujenHallinta = new HakujenHallintaPage(page)
      const haunTiedot = await hakujenHallinta.navigate(avustushakuID)

      // After loppuselvitys is submitted the haku is in "ratkaistu". To toggle
      // otantatarkastus we need to walk back through julkaistu -> luonnos so
      // the draft button enables and the radio becomes editable.
      await haunTiedot.publishAvustushaku()
      await haunTiedot.setAvustushakuInDraftState()
      await hakujenHallinta.locators.otantatarkastus.enableRadio.click()

      await expect(hakujenHallinta.locators.otantatarkastus.backfillConfirmModal).toContainText('1')
      await hakujenHallinta.locators.otantatarkastus.backfillConfirmButton.click()

      // Restore haku lifecycle: julkaistu -> ratkaistu.
      await haunTiedot.publishAvustushaku()
      await haunTiedot.resolveAvustushaku()

      const lops = LoppuselvitysPage(page)
      await lops.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
      const banner = lops.locators.otantatarkastus.satunnaisotantaBanner
      const checklist = lops.locators.otantatarkastus.checklist
      await expect(banner.or(checklist)).toBeVisible()
    }
  )

  const enabledTest = selvitysTest.extend({
    enableOtantatarkastus: true,
  })

  enabledTest(
    'toggling otantamalli OFF makes drawn loppuselvityses fall back to 2-vaiheinen',
    async ({
      page,
      request,
      avustushakuID,
      acceptedHakemus: { hakemusID },
      loppuselvitysSubmitted,
    }) => {
      expect(loppuselvitysSubmitted).toBeDefined()

      // Force a deterministic draw so the post-toggle assertion is stable.
      const setResponse = await request.post(
        `${VIRKAILIJA_URL}/api/test/set-loppuselvitys-otantapolku`,
        { data: { 'hakemus-id': hakemusID, otantapolku: 'satunnaisotanta' } }
      )
      expect(setResponse.ok()).toBeTruthy()

      const hakujenHallinta = new HakujenHallintaPage(page)
      const haunTiedot = await hakujenHallinta.navigate(avustushakuID)

      await haunTiedot.publishAvustushaku()
      await haunTiedot.setAvustushakuInDraftState()
      await hakujenHallinta.locators.otantatarkastus.disableRadio.click()
      await haunTiedot.publishAvustushaku()
      await haunTiedot.resolveAvustushaku()

      const lops = LoppuselvitysPage(page)
      await lops.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
      // Haku flag gates the UI: with otantatarkastus OFF, the drawn satunnaisotanta
      // value is preserved in the DB but the loppuselvitys renders the 2-vaiheinen
      // path (no banner, no checklist).
      await expect(lops.locators.otantatarkastus.satunnaisotantaBanner).toBeHidden()
      await expect(lops.locators.otantatarkastus.checklist).toBeHidden()
    }
  )
})
