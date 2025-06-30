import { expect } from '@playwright/test'

import { switchUserIdentityTo } from '../../../utils/util'

import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { DefaultValueFixtures } from '../../../fixtures/defaultValues'

test('loppuselvitys asiatarkastus oikeudet käyttäjille', async ({
  page,
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  acceptedHakemus: { hakemusID },
}) => {
  expect(loppuselvitysFormFilled)
  const loppuselvitysPage = LoppuselvitysPage(page)
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
  const va = page.getByText('_ valtionavustus')
  const paiviPaakayttaja = page.getByText('Päivi Pääkäyttäjä')
  const viiviVirkailija = page.getByText('Viivi Virkailija')
  const acceptText = 'Ei huomioita'
  await test.step('valmistelija voi asiatarkastaa', async () => {
    await expect(va).toBeVisible()
    await expect(paiviPaakayttaja).toBeHidden()
    await expect(viiviVirkailija).toBeHidden()
    await expect(loppuselvitysPage.locators.asiatarkastus.acceptMessage).toBeEditable()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeDisabled()
    await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill(acceptText)
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeEnabled()
  })
  await test.step('taloustarkastaja ei voi asiatarkastaa', async () => {
    await switchUserIdentityTo(page, 'viivivirkailija')
    await expect(va).toBeHidden()
    await expect(paiviPaakayttaja).toBeHidden()
    await expect(viiviVirkailija).toBeVisible()
    await expect(loppuselvitysPage.locators.asiatarkastus.acceptMessage).not.toBeEditable()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeDisabled()
  })
  await test.step('pääkäyttäjä joka ei ole valmistelija voi asiatarkastaa', async () => {
    await switchUserIdentityTo(page, 'paivipaakayttaja')
    await expect(va).toBeHidden()
    await expect(paiviPaakayttaja).toBeVisible()
    await expect(viiviVirkailija).toBeHidden()
    await expect(loppuselvitysPage.locators.asiatarkastus.acceptMessage).toBeEditable()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeDisabled()
    await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill(acceptText)
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeEnabled()
    await loppuselvitysPage.locators.asiatarkastus.confirmAcceptance.click()
  })
  const expectAsiastarkastusTextIsShown = async () => {
    const asiatarkastusText = page.getByText(acceptText)
    await expect(asiatarkastusText).toBeHidden()
    await loppuselvitysPage.locators.asiatarkastettu.click()
    await expect(asiatarkastusText).toBeVisible()
  }
  await test.step('asiatarkastus näkyy kaikille', async () => {
    await expectAsiastarkastusTextIsShown()
    await switchUserIdentityTo(page, 'valtionavustus')
    await expectAsiastarkastusTextIsShown()
    await switchUserIdentityTo(page, 'viivivirkailija')
    await expectAsiastarkastusTextIsShown()
  })
})

test.extend<Pick<DefaultValueFixtures, 'ukotettuValmistelija'>>({
  ukotettuValmistelija: 'Viivi Virkailija',
})(
  'loppuselvitys asiatarkastus  valmistelijalla happy path',
  async ({
    page,
    avustushakuID,
    loppuselvitysSubmitted: { loppuselvitysFormFilled },
    acceptedHakemus: { hakemusID },
  }) => {
    expect(loppuselvitysFormFilled)
    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    const va = page.getByText('_ valtionavustus')
    const paiviPaakayttaja = page.getByText('Päivi Pääkäyttäjä')
    const viiviVirkailija = page.getByText('Viivi Virkailija')
    const acceptText = 'Ei huomioita'
    await test.step('valmistelija voi asiatarkastaa', async () => {
      await switchUserIdentityTo(page, 'viivivirkailija')
      await expect(va).toBeHidden()
      await expect(paiviPaakayttaja).toBeHidden()
      await expect(viiviVirkailija).toBeVisible()

      await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill(acceptText)
      await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeEnabled()
      await loppuselvitysPage.locators.asiatarkastus.confirmAcceptance.click()

      const asiatarkastusText = page.getByText(acceptText)
      await expect(asiatarkastusText).toBeHidden()
      await loppuselvitysPage.locators.asiatarkastettu.click()
      await expect(asiatarkastusText).toBeVisible()
    })
  }
)
