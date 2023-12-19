import { KoodienhallintaPage } from '../pages/virkailija/koodienHallintaPage'
import { randomString } from '../utils/random'
import { muutoshakemusTest } from './muutoshakemusTest'
import muutoshakemusEnabledHakuLomakeJson from './prod.hakulomake.json'

const jotpaToimintayksikkö = {
  name: 'Jatkuvan oppimisen ja työllisyyden palvelukeskus',
  code: '6600105300',
}

interface JotpaFixtures {
  hakulomake: string
}

const requiredAttachmentField = {
  fieldClass: 'wrapperElement',
  id: 'mandatory-attachments',
  fieldType: 'theme',
  children: [
    {
      fieldClass: 'wrapperElement',
      id: 'named-attachments-fieldset',
      fieldType: 'fieldset',
      children: [
        {
          label: {
            fi: 'Edellisen tilikauden tuloslaskelma ja tase liitetietoineen',
            sv: 'Edellisen tilikauden tuloslaskelma ja tase liitetietoineen på svenska',
          },
          fieldClass: 'formField',
          helpText: {
            fi: '',
            sv: '',
          },
          id: 'previous-income-statement-and-balance-sheet',
          required: true,
          fieldType: 'namedAttachment',
        },
      ],
    },
  ],
  label: {
    fi: 'Vaaditut liitteet',
    sv: 'Vaaditut liitteet på svenska',
  },
}

const hakulomakeWithOneRequiredAttachment = {
  ...muutoshakemusEnabledHakuLomakeJson,
  content: [...muutoshakemusEnabledHakuLomakeJson.content, requiredAttachmentField],
}

export const JotpaTest = muutoshakemusTest.extend<JotpaFixtures>({
  hakulomake: JSON.stringify(hakulomakeWithOneRequiredAttachment),
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
