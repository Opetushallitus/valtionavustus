import { expect } from '@playwright/test'
import { selvitysTest } from '../../../fixtures/selvitysTest'
import { HakujenHallintaPage } from '../../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { VIRKAILIJA_URL } from '../../../utils/constants'

selvitysTest.describe('Otantatarkastus backwards-compat', () => {
  selvitysTest(
    'toggling muutoshakukelpoisuus still requires walking back through julkaistu -> luonnos',
    async ({ page, avustushakuID, loppuselvitysSubmitted }) => {
      expect(loppuselvitysSubmitted).toBeDefined()

      const hakujenHallinta = new HakujenHallintaPage(page)
      const haunTiedot = await hakujenHallinta.navigate(avustushakuID)
      await haunTiedot.common.waitForAvustushakuReady()

      await expect(haunTiedot.locators.loppuselvitystenTarkastus.otantatarkastus).toBeEnabled()
      await expect(haunTiedot.locators.muutoshakukelpoinen.no).toBeDisabled()

      // After loppuselvitys is submitted the haku is in "ratkaistu". To toggle
      // muutoshakukelpoinen we need to walk back through julkaistu -> luonnos so
      // the draft button enables and the radio becomes editable.
      await haunTiedot.publishAvustushaku()
      await haunTiedot.setAvustushakuInDraftState()
      await expect(haunTiedot.locators.muutoshakukelpoinen.no).toBeEnabled()

      await hakujenHallinta.toggleMuutoshakukelpoisuus(false)

      // Restore haku lifecycle: julkaistu -> ratkaistu, and the field locks again.
      await haunTiedot.publishAvustushaku()
      await haunTiedot.resolveAvustushaku()
      await expect(haunTiedot.locators.muutoshakukelpoinen.no).toBeChecked()
      await expect(haunTiedot.locators.muutoshakukelpoinen.no).toBeDisabled()
    }
  )

  selvitysTest(
    'otantatarkastus can be toggled ON while the haku stays in ratkaistu',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvitysSubmitted }) => {
      expect(loppuselvitysSubmitted).toBeDefined()

      const hakujenHallinta = new HakujenHallintaPage(page)
      const haunTiedot = await hakujenHallinta.navigate(avustushakuID)

      await haunTiedot.common.waitForAvustushakuReady()
      await hakujenHallinta.locators.otantatarkastus.enableRadio.click()
      await expect(hakujenHallinta.locators.otantatarkastus.backfillConfirmModal).toContainText(
        'Hakuun on jo saapunut 1 loppuselvitys, jolle ei ole vielä tehty asiatarkastusta.'
      )
      await hakujenHallinta.locators.otantatarkastus.backfillConfirmButton.click()
      await haunTiedot.common.waitForSave()

      // The haku lifecycle is untouched: no julkaistu -> luonnos detour needed.
      await expect(haunTiedot.locators.loppuselvitystenTarkastus.otantatarkastus).toBeChecked()

      const lops = LoppuselvitysPage(page)
      await lops.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
      await expect(lops.locators.otantatarkastus.checklist).toBeVisible()
    }
  )

  selvitysTest(
    'enabling otantatarkastus in a resolved haku asks for confirmation even with nothing to draw',
    async ({ page, avustushakuID, acceptedHakemus }) => {
      expect(acceptedHakemus.hakemusID).toBeDefined()

      const hakujenHallinta = new HakujenHallintaPage(page)
      const haunTiedot = await hakujenHallinta.navigate(avustushakuID)
      await haunTiedot.common.waitForAvustushakuReady()

      // Haku is resolved but no loppuselvitys has been submitted yet, so there is
      // nothing to draw. The confirmation is still shown: the choice governs every
      // loppuselvitys arriving from here on.
      await hakujenHallinta.locators.otantatarkastus.enableRadio.click()
      await expect(hakujenHallinta.locators.otantatarkastus.backfillConfirmModal).toContainText(
        'ei ole tällä hetkellä yhtään asiatarkastamatonta loppuselvitystä'
      )

      // Await the save itself: the radio flips in redux before the POST resolves, so
      // asserting on the DOM alone would pass even if the server rejected the save.
      const [saveResponse] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().endsWith(`/api/avustushaku/${avustushakuID}`) && r.request().method() === 'POST'
        ),
        hakujenHallinta.locators.otantatarkastus.backfillConfirmButton.click(),
      ])
      expect(saveResponse.ok()).toBeTruthy()
      await haunTiedot.common.waitForSave()

      await page.reload()
      await haunTiedot.common.waitForAvustushakuReady()
      await expect(haunTiedot.locators.loppuselvitystenTarkastus.otantatarkastus).toBeChecked()
    }
  )

  const enabledTest = selvitysTest.extend({
    enableOtantatarkastus: true,
  })

  enabledTest(
    'toggling otantatarkastus OFF makes drawn loppuselvityses fall back to 2-vaiheinen',
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

  enabledTest(
    'a loppuselvitys with a drawn otantapolku can be asiatarkastettu after otantatarkastus is turned OFF',
    async ({
      page,
      request,
      avustushakuID,
      acceptedHakemus: { hakemusID },
      loppuselvitysSubmitted,
    }) => {
      expect(loppuselvitysSubmitted).toBeDefined()

      const setResponse = await request.post(
        `${VIRKAILIJA_URL}/api/test/set-loppuselvitys-otantapolku`,
        { data: { 'hakemus-id': hakemusID, otantapolku: 'satunnaisotanta' } }
      )
      expect(setResponse.ok()).toBeTruthy()

      const hakujenHallinta = new HakujenHallintaPage(page)
      const haunTiedot = await hakujenHallinta.navigate(avustushakuID)
      await haunTiedot.common.waitForAvustushakuReady()
      await hakujenHallinta.locators.otantatarkastus.disableRadio.click()
      await haunTiedot.common.waitForSave()

      // The drawn otantapolku stays in the database, but the haku is back on the
      // 2-vaiheinen path: asiatarkastus posts no checklist and must still go through,
      // otherwise the loppuselvitys would be stuck with no way to supply one.
      const lops = LoppuselvitysPage(page)
      await lops.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
      await expect(lops.locators.otantatarkastus.checklist).toBeHidden()

      await lops.asiatarkastaLoppuselvitys('Asiatarkastettu 2-vaiheisena')

      // Verified without acceptance: the loppuselvitys moves on to taloustarkastus.
      await expect(lops.locators.taloustarkastettu).toBeHidden()
      await expect(lops.locators.taloustarkastus.accept).toBeVisible()
    }
  )
})
