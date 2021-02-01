import axios from 'axios'

import { StandardizedFormValues } from './types'
import { standardizedFormValuesSchema, initialValues } from './formik'

const timeout = 10000 // 10 seconds
const client = axios.create({ timeout })

export async function postStandardizedFields(avustushakuId: number, values: StandardizedFormValues) {
  const url = `/api/avustushaku/${avustushakuId}/standardized-fields`

  return client.post(url, values)
}

export async function getStandardizedFields(avustushakuId: number) {
  const url = `/api/avustushaku/${avustushakuId}/standardized-fields`

  const response = await client.get(url).catch(err => {

    if (err.response.status === 404) {
      return {
        data: initialValues
      }
    }
    throw err
  })

  const values = await standardizedFormValuesSchema.validate(response.data)
  return values
}

export async function getStandardizedHakemusFields(avustushakuId: number, userKey: string) {
  const url = `/api/avustushaku/${avustushakuId}/hakemus/${userKey}/standardized-fields`

  const response = await client.get(url)
  const values = await standardizedFormValuesSchema.validate(response.data)
  return values
}
