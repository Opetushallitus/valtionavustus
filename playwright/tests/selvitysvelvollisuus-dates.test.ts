import { defaultValues } from '../fixtures/defaultValues'
import { expectToBeDefined } from '../utils/util'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { randomString } from '../utils/random'

const test = defaultValues

test('virkailija can set and unset selvitysvelvollisuus dates', async ({
  page,
  hakuProps,
  userCache,
}) => {
  expectToBeDefined(userCache)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  let avustushakuID = await hakujenHallintaPage.copyEsimerkkihaku()
  await hakujenHallintaPage.fillAvustushaku({
    ...hakuProps,
    avustushakuName: `Selvityspäivämäärä test - haku ${randomString()}`,
    hankkeenAlkamispaiva: '20.04.1969',
    hankkeenPaattymispaiva: '29.12.1969',
  })
  await hakujenHallintaPage.navigate(avustushakuID)
  const paatosPage = await hakujenHallintaPage.commonHakujenHallinta.switchToPaatosTab()
  const { valiselvitysDate, loppuselvitysDate } = paatosPage.locators
  await test.step('virkailija can set selvitysvelvollisuus dates', async () => {
    await valiselvitysDate.fill('12.5.2023')
    await page.keyboard.press('Tab')
    await paatosPage.common.waitForSave()
    await loppuselvitysDate.fill('12.6.2023')
    await page.keyboard.press('Tab')
    await paatosPage.common.waitForSave()
  })

  await test.step('virkailija can unset selvitysvelvollisuus dates', async () => {
    await valiselvitysDate.fill('')
    await page.keyboard.press('Tab')
    await paatosPage.common.waitForSave()
    await loppuselvitysDate.fill('')
    await page.keyboard.press('Tab')
    await paatosPage.common.waitForSave()
  })
})
