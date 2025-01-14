import { KoodienhallintaPage } from './pages/virkailija/koodienHallintaPage'
import { randomString } from './utils/random'
import { muutoshakemusTest } from './fixtures/muutoshakemusTest'

export const multipleProjectCodesTest = muutoshakemusTest.extend({
  codes: async ({ page }, use) => {
    const koodienhallintaPage = KoodienhallintaPage(page)
    await koodienhallintaPage.navigate()
    const uniqueCode = () => randomString().substring(0, 13)
    const codes = await koodienhallintaPage.createCodeValues({
      operationalUnit: uniqueCode(),
      project: [uniqueCode(), uniqueCode(), uniqueCode()],
    })
    await use(codes)
  },
})
