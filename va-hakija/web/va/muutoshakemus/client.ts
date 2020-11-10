import axios from 'axios'
import {AvustuksenKayttoajanPidennys, ChangingContactPersonDetails} from './store/context'
import moment from 'moment'

const timeout = 10000 // 10 seconds
const client = axios.create({ timeout })

type MuutoshakemusProps = {
  avustushakuId: number
  hakemusVersion: number
  userKey: string
  jatkoaika?: Partial<AvustuksenKayttoajanPidennys>
  yhteyshenkilo?: ChangingContactPersonDetails
}

function convertDateToDateString(jatkoaika: Partial<AvustuksenKayttoajanPidennys>) {
  const { haettuKayttoajanPaattymispaiva: paiva } = jatkoaika
  return {
    ...jatkoaika,
    haettuKayttoajanPaattymispaiva: paiva ? moment(paiva).format('YYYY-MM-DD') : null
  }
}

export async function postMuutoshakemus(props: MuutoshakemusProps) {
  const {avustushakuId, hakemusVersion, userKey, jatkoaika, yhteyshenkilo} = props

  const url = `api/muutoshakemus/${avustushakuId}/hakemus/${userKey}`

  return client.post(url, {
    hakemusVersion: hakemusVersion,
    ...jatkoaika?.haenKayttoajanPidennysta && { jatkoaika: convertDateToDateString(jatkoaika) },
    ...yhteyshenkilo && { yhteyshenkilo: yhteyshenkilo },
  })
}
