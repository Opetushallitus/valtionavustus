import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'
import { Message } from './ViestiLista'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { Lahetys } from '../../hakujen-hallinta-page/haku-details/Tapahtumaloki'
import { mapEmails } from '../../apiSlice'

type EmailType = 'loppuselvitys-muistutus'

export async function sendEmail(
  type: EmailType,
  avustushaku: Avustushaku,
  hakemus: Hakemus,
  content: string,
  subject: string,
  receivers: string[]
) {
  await HttpUtil.post(
    `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/send-email/${type}`,
    {
      lang: hakemus.language,
      body: content,
      subject: subject,
      to: receivers,
    }
  )
}

export async function fetchSentEmails(
  avustushaku: Avustushaku,
  hakemus: Hakemus,
  emailType: string
): Promise<Message[]> {
  const sentEmails = await HttpUtil.get<Lahetys[]>(
    `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/tapahtumaloki/${emailType}`
  )
  return sentEmails.flatMap(mapEmails)
}
