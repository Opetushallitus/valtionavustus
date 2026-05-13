import { expect } from '@playwright/test'
import { selvitysTest } from '../../../fixtures/selvitysTest'
import { HakujenHallintaPage } from '../../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'

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

      await expect(hakujenHallinta.locators.otantatarkastus.backfillToast).toBeVisible()

      const lops = LoppuselvitysPage(page)
      await lops.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
      const banner = lops.locators.otantatarkastus.satunnaisotantaBanner
      const checklist = lops.locators.otantatarkastus.checklist
      await expect(banner.or(checklist)).toBeVisible()
    }
  )
})
