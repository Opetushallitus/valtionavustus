import { blob as blobConsumer } from 'node:stream/consumers'
import { expect, Locator } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { getPdfFirstPageTextContent } from '../../utils/pdfUtil'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import { waitForSave } from '../../pages/virkailija/hakujen-hallinta/CommonHakujenHallintaPage'
import type { Blob } from 'node:buffer'
import { createJotpaCodes } from '../../fixtures/JotpaTest'
import { VIRKAILIJA_URL } from '../../utils/constants'

async function downloadPdfFromLocator(locator: Locator): Promise<Blob> {
  const downloadPromise = locator.page().waitForEvent('download')
  await locator.click()
  const download = await downloadPromise
  return await blobConsumer(await download.createReadStream())
}

test.extend({
  avustushakuName: async ({}, use) => await use('paatos liitteet test'),
  hakuProps: async ({ hakuProps }, use) => {
    await use({
      ...hakuProps,
      registerNumber: '4/20',
    })
  },
})(
  'paatos liitteet',
  async ({
    page,
    closedAvustushaku: { id: avustushakuID },
    answers,
    ukotettuValmistelija,
    projektikoodi,
  }) => {
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
      paatoksenPerustelut: 'Timanttinen hakemus, ei voi muuta sanoa kun hattua nostaa!',
    })
    const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
    await haunTiedotPage.resolveAvustushaku()
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)

    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)

    const { yleisOhjeCheckbox, yleisOhjeLiite, pakoteOhjeCheckbox, jotpaOhjeCheckbox } =
      paatosPage.locators
    const amountOfYleisohjeet = 6
    const yleisohjeAmountStartingFromZero = amountOfYleisohjeet - 1
    await expect(yleisOhjeLiite).toHaveCount(amountOfYleisohjeet)

    const yleisohjeCount = 5
    await test.step('newest ohje is preselected and all are disabled', async () => {
      await expect(yleisOhjeLiite).toHaveCount(yleisohjeCount + 1)
      for (let i = 0; i <= yleisohjeCount; i++) {
        const nthYleisohje = yleisOhjeLiite.nth(i)
        await expect(nthYleisohje).toBeDisabled()
        await expect(nthYleisohje).not.toBeChecked()
      }
    })
    await test.step('add yleisohje to paatos', async () => {
      await expect(yleisOhjeCheckbox).not.toBeChecked()
      await yleisOhjeCheckbox.click()
      await expect(yleisOhjeCheckbox).toBeChecked()
      await hakemustenArviointiPage.waitForSave()
      await expect(yleisOhjeLiite.nth(yleisohjeCount)).toBeChecked()
    })
    await test.step('after selecting to add yleisohje only the newest ohje is enabled and checked', async () => {
      for (let i = 0; i <= yleisohjeAmountStartingFromZero; i++) {
        const nthYleisohje = yleisOhjeLiite.nth(i)
        if (i === yleisohjeAmountStartingFromZero) {
          await expect(nthYleisohje).toBeEnabled()
          await expect(nthYleisohje).toBeChecked()
          await nthYleisohje.click()
        } else {
          await expect(nthYleisohje).toBeDisabled()
          await expect(nthYleisohje).not.toBeChecked()
        }
      }
    })
    await test.step('pakote ohje is enabled by default', async () => {
      await expect(pakoteOhjeCheckbox).toBeChecked()
    })
    await test.step('JOTPA ohje is not enabled by default', async () => {
      await expect(jotpaOhjeCheckbox).not.toBeChecked()
    })

    await test.step('make sure link to yleisohje is in paatos', async () => {
      const paatosPage = PaatosPage(page)
      await paatosPage.navigateTo(avustushakuID)
      await paatosPage.sendPaatos()
      await paatosPage.navigateToLatestHakijaPaatos(hakemusID)

      const yleisohjeLink = page.locator('a').locator('text=Valtionavustusten yleisohje')
      const href = '/liitteet/va_yleisohje_2023-05_fi.pdf'
      expect(await yleisohjeLink.getAttribute('href')).toBe(href)

      await test.step('Make sure user can download yleisohje PDF', async () => {
        const blob = await downloadPdfFromLocator(yleisohjeLink)
        const pdfText = await getPdfFirstPageTextContent(blob)
        expect(pdfText).toContain('12.5.2023')
        expect(pdfText).toContain('YLEISOHJE')
      })
    })

    await test.step('make sure JOTPA yleisohje is not visible', async () => {
      const yleisohjeLink = page.locator('a').locator('text=JOTPA: Valtionavustusten vakioehdot')
      await expect(yleisohjeLink).not.toBeVisible()
    })

    await test.step('make sure pakoteohje is in paatos', async () => {
      const pakoteohjeLink = page
        .locator('a')
        .locator('text=Pakotteiden huomioon ottaminen valtionavustustoiminnassa')
      const blob = await downloadPdfFromLocator(pakoteohjeLink)
      const pdfText = await getPdfFirstPageTextContent(blob)
      expect(pdfText).toContain('Pakotteiden huomioon ottaminen valtionavustustoiminnassa')
    })

    await test.step('paatos page matches snapshot', async () => {
      await expect(page).toHaveScreenshot({
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    await test.step('uncheck pakoteohje', async () => {
      await paatosPage.navigateTo(avustushakuID)

      await expect(yleisOhjeCheckbox).toBeChecked()
      await expect(pakoteOhjeCheckbox).toBeChecked()
      await pakoteOhjeCheckbox.click()
      await expect(pakoteOhjeCheckbox).not.toBeChecked()
      await paatosPage.common.waitForSave()
    })
    await test.step('pakoteohje gets removed after recreating and sending paatokset', async () => {
      await paatosPage.recreatePaatokset()
      await paatosPage.resendPaatokset()
      await paatosPage.navigateToLatestHakijaPaatos(hakemusID)

      const yleisohjeLink = page.locator('a').locator('text=Valtionavustusten yleisohje')
      await expect(yleisohjeLink).toBeVisible()
      const pakoteohjeLink = page
        .locator('a')
        .locator('text=Pakotteiden huomioon ottaminen valtionavustustoiminnassa')
      await expect(pakoteohjeLink).toBeHidden()
    })
  }
)

test.extend({
  avustushakuName: async ({}, use) => await use('Jotpa paatos liitteet test'),
  codes: async ({ page }, use) => {
    const codes = await createJotpaCodes(page)
    await use(codes)
  },
  hakuProps: async ({ hakuProps }, use) => {
    await use({
      ...hakuProps,
      registerNumber: '4/20',
    })
  },
})(
  'Jotpa paatos liitteet',
  async ({
    page,
    closedAvustushaku: { id: avustushakuID },
    answers,
    ukotettuValmistelija,
    projektikoodi,
  }) => {
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
      paatoksenPerustelut: 'Timanttinen hakemus, ei voi muuta sanoa kun hattua nostaa!',
    })
    const kayttotarkoitus = 'Tarkoitus olisi olla käyttämättä koko summaa Alkoon'
    const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
    await haunTiedotPage.resolveAvustushaku()
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)

    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)

    await test.step('When JOTPA vakioehdot is added and päätös is created', async () => {
      await paatosPage.navigateTo(avustushakuID)
      await paatosPage.locators.kayttotarkoitus.fill(kayttotarkoitus)
      await Promise.all([paatosPage.locators.jotpaOhjeCheckbox.click(), waitForSave(page)])
      await paatosPage.sendPaatos()

      await test.step('And user navigates to päätös page', async () => {
        await paatosPage.navigateToLatestHakijaPaatos(hakemusID)

        await test.step('JOTPA yleisohje is visible', async () => {
          const yleisohjeLink = page
            .locator('a')
            .locator('text=JOTPA: Valtionavustusten vakioehdot')
          await expect(yleisohjeLink).toBeVisible()
        })
        await test.step('VA yleisohje is not visible', async () => {
          const yleisohjeLink = page.locator('a').locator('text=Valtionavustusten yleisohje')
          await expect(yleisohjeLink).not.toBeVisible()
        })
        await test.step('Käyttötarkoitus is not visible', async () => {
          await expect(page.getByText(kayttotarkoitus)).toHaveCount(0)
        })
        await test.step('PDF contains Jotpa yleisohje', async () => {
          const pdfLink = page.getByText('JOTPA: Valtionavustusten vakioehdot')
          const blob = await downloadPdfFromLocator(pdfLink)
          const pdfText = await getPdfFirstPageTextContent(blob)
          expect(pdfText).toContain('1.3.2024')
          expect(pdfText).toContain('Jatkuvan oppimisen ja työllisyyden palvelukeskus')
        })
        await test.step('JOTPA paatos matches snapshot', async () => {
          await expect(page).toHaveScreenshot({
            fullPage: true,
            maxDiffPixelRatio: 0.05,
          })
        })
      })
    })
  }
)

test.extend({
  avustushakuName: async ({}, use) => await use('old yleisohje version test'),
  hakuProps: async ({ hakuProps }, use) => {
    await use({
      ...hakuProps,
      registerNumber: '4/20',
    })
  },
})(
  'grant with old yleisohje version stored in database shows newest version',
  async ({
    page,
    closedAvustushaku: { id: avustushakuID },
    answers,
    ukotettuValmistelija,
    projektikoodi,
  }) => {
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
      paatoksenPerustelut: 'Timanttinen hakemus, ei voi muuta sanoa kun hattua nostaa!',
    })
    const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
    await haunTiedotPage.resolveAvustushaku()
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)

    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)

    const { yleisOhjeCheckbox } = paatosPage.locators
    const newestVersionRadio = page.locator('[data-liite=va_yleisohje][value="_2023-05"]')

    await test.step('select yleisohje to save it to database', async () => {
      await yleisOhjeCheckbox.click()
      await expect(yleisOhjeCheckbox).toBeChecked()
      await hakemustenArviointiPage.waitForSave()
      await expect(newestVersionRadio).toBeChecked()
    })

    await test.step('inject old yleisohje version via API to simulate legacy data', async () => {
      const hakuDataResponse = await page.request.get(
        `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`
      )
      const hakuData = await hakuDataResponse.json()
      const avustushaku = hakuData.avustushaku

      const modifiedDecision = {
        ...avustushaku.decision,
        liitteet: avustushaku.decision.liitteet.map(
          (liite: { group: string; id: string; version: string }) => {
            if (liite.id === 'va_yleisohje') {
              return { ...liite, version: '_2021-05' }
            }
            return liite
          }
        ),
      }

      await page.request.post(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`, {
        data: { ...avustushaku, decision: modifiedDecision },
      })
    })

    await test.step('reload page and verify old version is shown but newest is enabled', async () => {
      await paatosPage.navigateTo(avustushakuID)
      await expect(yleisOhjeCheckbox).toBeChecked()

      const oldVersionRadio = page.locator('[data-liite=va_yleisohje][value="_2021-05"]')
      await expect(oldVersionRadio).toBeChecked()
      await expect(newestVersionRadio).not.toBeChecked()
      await expect(newestVersionRadio).toBeEnabled()
    })

    await test.step('old versions are disabled', async () => {
      const olderVersions = page.locator('[data-liite=va_yleisohje]:not([value="_2023-05"])')
      const count = await olderVersions.count()
      for (let i = 0; i < count; i++) {
        await expect(olderVersions.nth(i)).toBeDisabled()
      }
    })

    await test.step('user can switch to newest version and decision PDF uses it', async () => {
      await newestVersionRadio.click()
      await hakemustenArviointiPage.waitForSave()
      await expect(newestVersionRadio).toBeChecked()

      await paatosPage.sendPaatos()
      await paatosPage.navigateToLatestHakijaPaatos(hakemusID)

      const yleisohjeLink = page.locator('a').locator('text=Valtionavustusten yleisohje')
      const href = '/liitteet/va_yleisohje_2023-05_fi.pdf'
      expect(await yleisohjeLink.getAttribute('href')).toBe(href)
    })
  }
)
