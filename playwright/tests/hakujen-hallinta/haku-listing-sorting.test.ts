import { expect } from '@playwright/test'
import { selvitysTest } from '../../fixtures/selvitysTest'
import {
  HakujenHallintaPage,
  HakuProps,
} from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { expectToBeDefined } from '../../utils/util'
import moment from 'moment'
import { MaksatuksetPage } from '../../pages/virkailija/hakujen-hallinta/maksatuksetPage'
import { HaunTiedotPage } from '../../pages/virkailija/hakujen-hallinta/HaunTiedotPage'

const prefix1 = 'AAAAA1'
const prefix2 = 'AAAAA2'

const test = selvitysTest.extend<{
  secondHakuProps: HakuProps
  haunTiedotPage: ReturnType<typeof HaunTiedotPage>
}>({
  avustushakuName: async ({ avustushakuName }, use) => {
    await use(`${prefix1} ${avustushakuName}`)
  },
  hakuProps: async ({ hakuProps }, use) => {
    await use({ ...hakuProps, jaossaOlevaSumma: 100000 })
  },
  secondHakuProps: async ({ valiAndLoppuselvitysSubmitted, page, hakuProps }, use) => {
    expectToBeDefined(valiAndLoppuselvitysSubmitted)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const secondAvustushakuName = hakuProps.avustushakuName.replace(prefix1, prefix2)
    const secondHakuProps = {
      ...hakuProps,
      jaossaOlevaSumma: undefined,
      hakuaikaStart: moment().subtract(1, 'day').toDate(),
      hakuaikaEnd: moment().add(1, 'month').toDate(),
      avustushakuName: secondAvustushakuName,
      hankkeenAlkamispaiva: moment().add(1, 'month').format('DD.MM.YY'),
      hankkeenPaattymispaiva: moment().add(7, 'month').format('DD.MM.YY'),
    }
    await hakujenHallintaPage.createMuutoshakemusDisabledHaku(secondHakuProps)
    await use(secondHakuProps)
  },
  haunTiedotPage: async ({ secondHakuProps, avustushakuID, avustushakuName, page }, use) => {
    expectToBeDefined(secondHakuProps)
    const maksatuksetPage = MaksatuksetPage(page)
    await maksatuksetPage.goto(avustushakuName)
    await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await use(await hakujenHallintaPage.navigate(avustushakuID))
  },
})

test('sorting haku table', async ({ haunTiedotPage, avustushakuName, secondHakuProps }) => {
  const todayFormatted = moment().format('DD.MM.YY')
  const { hakuaikaStart, hakuaikaEnd, avustushakuName: secondAvustushakuName } = secondHakuProps
  const secondAvustushakuStartFormatted = moment(hakuaikaStart).format('DD.MM.YY')
  const secondAvustushakuEndFormatted = moment(hakuaikaEnd).format('DD.MM.YY')
  const {
    avustushaku,
    tila,
    vaihe,
    hakuaika,
    paatos,
    valiselvitykset,
    loppuselvitykset,
    vastuuvalmistelija,
    muutoshakukelpoinen,
    maksatukset,
    kayttoaikaAlkaa,
    kayttoaikaPaattyy,
    jaossaOllutSumma,
    maksettuSumma,
    budjetti,
  } = haunTiedotPage.common.locators.hakuListingTable
  await test.step('can be sorted by avustushaku name', async () => {
    await avustushaku.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.length).toBeGreaterThanOrEqual(1)
    expect(descSorted.indexOf(avustushakuName)).toBeGreaterThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await avustushaku.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeLessThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct tila for avustushaut', async () => {
    await expect(tila.cellValue(avustushakuName)).toContainText('Ratkaistu')
    await expect(tila.cellValue(secondAvustushakuName)).toContainText('Julkaistu')
  })
  await test.step('can be sorted by tila', async () => {
    await tila.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeLessThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await tila.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeGreaterThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct vaihe for avustushaut', async () => {
    await expect(vaihe.cellValue(avustushakuName)).toContainText('Päättynyt')
    await expect(vaihe.cellValue(secondAvustushakuName)).toContainText('Auki')
  })
  await test.step('can be sorted by vaihe', async () => {
    await vaihe.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeLessThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await vaihe.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeGreaterThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct hakuaika for avustushaut', async () => {
    await expect(hakuaika.cellValue(avustushakuName)).toContainText(
      `01.01.70 - ${moment().subtract(1, 'years').format('DD.MM.YY')}`
    )
    await expect(hakuaika.cellValue(secondAvustushakuName)).toContainText(
      `${secondAvustushakuStartFormatted} - ${secondAvustushakuEndFormatted}`
    )
  })
  await test.step('can be sorted by hakuaika', async () => {
    await hakuaika.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeGreaterThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await hakuaika.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeLessThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct päätös for avustushaut', async () => {
    await expect(paatos.cellValue(avustushakuName)).toContainText(todayFormatted)
    await expect(paatos.cellValue(secondAvustushakuName)).toContainText('-')
  })
  await test.step('can be sorted by päätös', async () => {
    await paatos.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeGreaterThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await paatos.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeLessThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct maksatukset for avustushaut', async () => {
    await expect(maksatukset.cellValue(avustushakuName)).toContainText(todayFormatted)
    await expect(maksatukset.cellValue(secondAvustushakuName)).toContainText('-')
  })
  await test.step('can be sorted by maksatukset', async () => {
    await maksatukset.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeGreaterThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await maksatukset.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeLessThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct valiselvitykset for avustushaut', async () => {
    await expect(valiselvitykset.cellValue(avustushakuName)).toContainText(todayFormatted)
    await expect(valiselvitykset.cellValue(secondAvustushakuName)).toContainText('-')
  })
  await test.step('can be sorted by valiselvitykset', async () => {
    await valiselvitykset.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeGreaterThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await valiselvitykset.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeLessThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct loppuselvitykset for avustushaut', async () => {
    await expect(loppuselvitykset.cellValue(avustushakuName)).toContainText(todayFormatted)
    await expect(loppuselvitykset.cellValue(secondAvustushakuName)).toContainText('-')
  })
  await test.step('can be sorted by loppuselvitykset', async () => {
    await loppuselvitykset.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeGreaterThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await loppuselvitykset.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeLessThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct valmistelija for avustushaut', async () => {
    await expect(vastuuvalmistelija.cellValue(avustushakuName)).toContainText('_v')
    await expect(vastuuvalmistelija.cellValue(secondAvustushakuName)).toContainText('_v')
  })
  await test.step('can be sorted by valmistelija', async () => {
    await vastuuvalmistelija.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeGreaterThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await vastuuvalmistelija.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeLessThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct muutoshakukelpoinen for avustushaut', async () => {
    await expect(muutoshakukelpoinen.cellValue(avustushakuName)).toContainText('Kyllä')
    await expect(muutoshakukelpoinen.cellValue(secondAvustushakuName)).toContainText('Ei')
  })
  await test.step('can be sorted by muutoshakukelpoinen', async () => {
    await muutoshakukelpoinen.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeLessThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await muutoshakukelpoinen.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeGreaterThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct budjetti for avustushaut', async () => {
    await expect(budjetti.cellValue(avustushakuName)).toContainText('Kokonaiskustannus')
    await expect(budjetti.cellValue(secondAvustushakuName)).toContainText('-')
  })
  await test.step('can be sorted by budjetti', async () => {
    await budjetti.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeLessThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await budjetti.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeGreaterThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct kayttoaika alkaa for avustushaut', async () => {
    await expect(kayttoaikaAlkaa.cellValue(avustushakuName)).toContainText('20.04.69')
    await expect(kayttoaikaAlkaa.cellValue(secondAvustushakuName)).toContainText(
      secondHakuProps.hankkeenAlkamispaiva
    )
  })
  await test.step('can be sorted by kayttoaika alkaa', async () => {
    await kayttoaikaAlkaa.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeGreaterThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await kayttoaikaAlkaa.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeLessThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct kayttoaika paattyy for avustushaut', async () => {
    await expect(kayttoaikaPaattyy.cellValue(avustushakuName)).toContainText('20.04.00')
    await expect(kayttoaikaPaattyy.cellValue(secondAvustushakuName)).toContainText(
      secondHakuProps.hankkeenPaattymispaiva
    )
  })
  await test.step('can be sorted by kayttoaika paattyy', async () => {
    await kayttoaikaPaattyy.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeLessThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await kayttoaikaPaattyy.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeGreaterThan(
      ascSorted.indexOf(secondAvustushakuName)
    )
  })
  await test.step('correct jaossa ollut summa for avustushaut', async () => {
    await expect(jaossaOllutSumma.cellValue(avustushakuName)).toContainText('100000')
    await expect(jaossaOllutSumma.cellValue(secondAvustushakuName)).toContainText('-')
  })
  await test.step('can be sorted by jaossa ollut summa', async () => {
    await jaossaOllutSumma.sort.click()
    const descSorted = await avustushaku.cellValues()
    expect(descSorted.indexOf(avustushakuName)).toBeLessThan(
      descSorted.indexOf(secondAvustushakuName)
    )
    await jaossaOllutSumma.sort.click()
    const ascSorted = await avustushaku.cellValues()
    expect(ascSorted.indexOf(avustushakuName)).toBeGreaterThanOrEqual(
      ascSorted.indexOf(secondAvustushakuName)
    )
    await test.step('correct maksettu summa for avustushaut', async () => {
      await expect(maksettuSumma.cellValue(avustushakuName)).toContainText('99999')
      await expect(maksettuSumma.cellValue(secondAvustushakuName)).toContainText('-')
    })
    await test.step('can be sorted by maksettu summa', async () => {
      await maksettuSumma.sort.click()
      const descSorted = await avustushaku.cellValues()
      expect(descSorted.indexOf(avustushakuName)).toBeLessThan(
        descSorted.indexOf(secondAvustushakuName)
      )
      await maksettuSumma.sort.click()
      const ascSorted = await avustushaku.cellValues()
      expect(ascSorted.indexOf(avustushakuName)).toBeGreaterThan(
        ascSorted.indexOf(secondAvustushakuName)
      )
    })
  })
})
