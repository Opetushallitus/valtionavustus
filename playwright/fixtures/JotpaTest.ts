import { KoodienhallintaPage } from '../pages/virkailija/koodienHallintaPage'
import { randomString } from '../utils/random'
import { muutoshakemusTest } from './muutoshakemusTest'
import muutoshakemusEnabledHakuLomakeJson from './prod.hakulomake.json'
import { Answers } from '../utils/types'
import { answers, dummyPdfPath, swedishAnswers } from '../utils/constants'
import type { Page } from '@playwright/test'

export const jotpaToimintayksikkö = {
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

const edellisenTilikaudenTuloslaskelmaTaseAttachment = {
  fieldId: 'previous-income-statement-and-balance-sheet',
  answer: dummyPdfPath,
  isFileAttachment: true,
}

const finnishAnswersWithRequiredAttachment = {
  ...answers,
  hakemusFields: [edellisenTilikaudenTuloslaskelmaTaseAttachment],
}
const swedishAnswersWithRequiredAttachment = {
  ...swedishAnswers,
  hakemusFields: [edellisenTilikaudenTuloslaskelmaTaseAttachment],
}

export const JotpaTest = muutoshakemusTest.extend<JotpaFixtures>({
  hakulomake: JSON.stringify(hakulomakeWithOneRequiredAttachment),
  answers: finnishAnswersWithRequiredAttachment,
  codes: async ({ page }, use) => {
    const codes = await createJotpaCodes(page)
    await use(codes)
  },
})

export const SwedishJotpaTest = JotpaTest.extend<{ answers: Answers }>({
  answers: swedishAnswersWithRequiredAttachment,
})

export async function createJotpaCodes(page: Page) {
  const koodienhallintaPage = KoodienhallintaPage(page)
  await koodienhallintaPage.navigate()
  const uniqueCode = () => randomString().substring(0, 13)
  const codes = await koodienhallintaPage.createCodeValues({
    operationalUnit: jotpaToimintayksikkö.code,
    operationalUnitName: jotpaToimintayksikkö.name,
    project: [uniqueCode()],
  })

  return codes
}
