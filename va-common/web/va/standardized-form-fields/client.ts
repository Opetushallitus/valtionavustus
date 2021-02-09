import axios from 'axios'

import { StandardizedFormHelpTexts } from './types'
import { standardizedFormHelpTextsSchema } from './types'

const timeout = 10000 // 10 seconds
const client = axios.create({ timeout })

export const initialValues: StandardizedFormHelpTexts = {
  "ohjeteksti-fi": '',
  "ohjeteksti-sv": '',
  "hakija-name-fi": '',
  "hakija-name-sv": '',
  "hakija-email-fi": '',
  "hakija-email-sv": '',
}

export async function postStandardizedFormHelpTexts(avustushakuId: number, values: StandardizedFormHelpTexts) {
  const url = `/api/avustushaku/${avustushakuId}/standardized-help-texts`

  return client.post(url, values)
}

export async function getStandardizedFormHelpTexts(avustushakuId: number) {
  const url = `/api/avustushaku/${avustushakuId}/standardized-help-texts`

  const response = await client.get(url).catch(err => {

    if (err.response.status === 404) {
      return {
        data: initialValues
      }
    }
    throw err
  })

  const values = await standardizedFormHelpTextsSchema.validate(response.data)
  return values
}

