import { Blob } from 'node:buffer'
import { blob as blobConsumer } from 'node:stream/consumers'
import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HAKIJA_URL } from '../../utils/constants'
import { getPdfFirstPageTextContent } from '../../utils/pdfUtil'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import { waitForSave } from '../../pages/virkailija/hakujen-hallinta/CommonHakujenHallintaPage'

test('paatos liitteet', async ({
  page,
  closedAvustushaku: { id: avustushakuID },
  answers,
  ukotettuValmistelija,
  projektikoodi,
}) => {
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

  const {
    erityisavustusEhdotCheckbox,
    yleisavustusEhdotCheckbox,
    yleisOhjeCheckbox,
    yleisOhjeLiite,
    pakoteOhjeCheckbox,
    jotpaOhjeCheckbox,
  } = paatosPage.locators
  const amountOfYleisohjeet = 6
  const yleisohjeAmountStartingFromZero = amountOfYleisohjeet - 1
  await expect(yleisOhjeLiite).toHaveCount(amountOfYleisohjeet)

  await test.step('ehdot liitteet are disabled and unchecked', async () => {
    await expect(erityisavustusEhdotCheckbox).toBeDisabled()
    await expect(erityisavustusEhdotCheckbox).not.toBeChecked()
    await expect(yleisavustusEhdotCheckbox).toBeDisabled()
    await expect(yleisavustusEhdotCheckbox).not.toBeChecked()
  })

  await test.step('newest ohje is preselected and all are disabled', async () => {
    for (let i = 0; i <= yleisohjeAmountStartingFromZero; i++) {
      const nthYleisohje = yleisOhjeLiite.nth(i)
      await expect(nthYleisohje).toBeDisabled()
      if (i === yleisohjeAmountStartingFromZero) {
        await expect(nthYleisohje).toBeChecked()
      } else {
        await expect(nthYleisohje).not.toBeChecked()
      }
    }
  })
  await test.step('add yleisohje to paatos', async () => {
    await expect(yleisOhjeCheckbox).not.toBeChecked()
    await yleisOhjeCheckbox.click()
    await expect(yleisOhjeCheckbox).toBeChecked()
    await hakemustenArviointiPage.waitForSave()
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
    await expect(yleisohjeLink).toBeVisible()
    const href = '/liitteet/va_yleisohje_2023-05_fi.pdf'
    expect(await yleisohjeLink.getAttribute('href')).toBe(href)

    await test.step('Make sure user can download yleisohje PDF', async () => {
      const res = await page.request.get(`${HAKIJA_URL}${href}`)
      const pdfBody = await res.body()
      const pdfText = await getPdfFirstPageTextContent(new Blob([pdfBody]))
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
      .locator(
        'text=Venäjän hyökkäyssotaan liittyvien pakotteiden huomioon ottaminen valtionavustustoiminnassa'
      )
    await expect(pakoteohjeLink).toBeVisible()
    const href = '/liitteet/va_pakoteohje.pdf'
    expect(await pakoteohjeLink.getAttribute('href')).toBe(href)
    const res = await page.request.get(`${HAKIJA_URL}${href}`)
    const pdfBody = await res.body()
    const pdfText = await getPdfFirstPageTextContent(new Blob([pdfBody]))
    expect(pdfText).toContain('Venäjän hyökkäyssotaan liittyvien pakotteiden huomioon ottaminen')
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
      .locator(
        'text=Venäjän hyökkäyssotaan liittyvien pakotteiden huomioon ottaminen valtionavustustoiminnassa'
      )
    await expect(pakoteohjeLink).toBeHidden()
  })

  await test.step('When JOTPA vakioehdot is added and päätös is created', async () => {
    await paatosPage.navigateTo(avustushakuID)
    await Promise.all([paatosPage.locators.jotpaOhjeCheckbox.click(), waitForSave(page)])
    await paatosPage.recreatePaatokset()
    await paatosPage.resendPaatokset()

    await test.step('And user navigates to päätös page', async () => {
      await paatosPage.navigateToLatestHakijaPaatos(hakemusID)

      await test.step('JOTPA yleisohje is visible', async () => {
        const yleisohjeLink = page.locator('a').locator('text=JOTPA: Valtionavustusten vakioehdot')
        await expect(yleisohjeLink).toBeVisible()
      })
      await test.step('VA yleisohje is not visible', async () => {
        const yleisohjeLink = page.locator('a').locator('text=Valtionavustusten yleisohje')
        await expect(yleisohjeLink).not.toBeVisible()
      })
      await test.step('PDF contains Jotpa yleisohje', async () => {
        const downloadPromise = page.waitForEvent('download')
        await page.getByText('JOTPA: Valtionavustusten vakioehdot').click()
        const download = await downloadPromise

        const blob = await blobConsumer(await download.createReadStream())
        const pdfText = await getPdfFirstPageTextContent(blob)
        expect(pdfText).toContain('1.3.2024')
        expect(pdfText).toContain('Jatkuvan oppimisen ja työllisyyden palvelukeskus')
      })
    })
  })
})
