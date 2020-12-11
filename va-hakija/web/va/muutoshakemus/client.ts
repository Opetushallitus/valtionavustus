import axios from 'axios'
import moment from 'moment'

import { FormValues } from './types'

const timeout = 10000 // 10 seconds
const client = axios.create({ timeout })

type MuutoshakemusProps = {
  userKey: string
  values: FormValues
}

export async function postMuutoshakemus(props: MuutoshakemusProps) {
  const { userKey, values } = props
  const url = `api/muutoshakemus/${userKey}`

  return client.post(url, {
    ...values.haenKayttoajanPidennysta && {
      jatkoaika: {
        haenKayttoajanPidennysta: true,
        haettuKayttoajanPaattymispaiva: moment(values.haettuKayttoajanPaattymispaiva).format('YYYY-MM-DD'),
        kayttoajanPidennysPerustelut: values.kayttoajanPidennysPerustelut,
      }
    },
    yhteyshenkilo: {
      name: values.name,
      email: values.email,
      phone: values.phone
    },
  })
}
