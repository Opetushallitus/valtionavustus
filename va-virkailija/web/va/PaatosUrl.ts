import type { Hakemus } from 'soresu-form/web/va/types'
import type { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

export default class PaatosUrl {
  static previewLink(avustushakuId: number, hakemusId: number): string {
    return '/paatos/avustushaku/' + avustushakuId + '/hakemus/' + hakemusId
  }

  static publicLink(avustushakuId: number, userKey: string): string {
    return '/public/paatos/avustushaku/' + avustushakuId + '/hakemus/' + userKey
  }

  static hakijaPublicLink(
    environment: EnvironmentApiResponse,
    avustushakuId: number,
    hakemus: Hakemus
  ) {
    const lang = hakemus.language
    return `${environment['hakija-server'].url[lang]}paatos/avustushaku/${avustushakuId}/hakemus/${hakemus['user-key']}`
  }
}
