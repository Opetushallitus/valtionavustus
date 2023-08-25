import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'
import { Message } from './ViestiLista'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { Lahetys } from '../../hakujen-hallinta-page/haku-details/Tapahtumaloki'
import { mapEmails } from '../../apiSlice'

export async function fetchSentEmails(
  avustushaku: Avustushaku,
  hakemus: Hakemus,
  emailType: string
): Promise<Message[]> {
  console.log(avustushaku, hakemus, emailType)
  const sentEmails = await HttpUtil.get<Lahetys[]>(
    `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/tapahtumaloki/${emailType}`
  )
  return sentEmails.flatMap(mapEmails)
}
