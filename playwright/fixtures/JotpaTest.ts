import { KoodienhallintaPage } from '../pages/virkailija/koodienHallintaPage'
import { randomString } from '../utils/random'
import { muutoshakemusTest } from './muutoshakemusTest'

const jotpaToimintayksikkö = {
  name: 'Jatkuvan oppimisen ja työllisyyden palvelukeskus',
  code: '6600105300',
}

export const JotpaTest = muutoshakemusTest.extend({
  codes: async ({ page }, use) => {
    const koodienhallintaPage = KoodienhallintaPage(page)
    await koodienhallintaPage.navigate()
    const uniqueCode = () => randomString().substring(0, 13)
    const codes = await koodienhallintaPage.createCodeValues({
      operationalUnit: jotpaToimintayksikkö.code,
      operationalUnitName: jotpaToimintayksikkö.name,
      project: [uniqueCode()],
      operation: uniqueCode(),
    })
    await use(codes)
  },
})
