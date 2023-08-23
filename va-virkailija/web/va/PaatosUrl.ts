export default class PaatosUrl {
  static previewLink(avustushakuId: number, hakemusId: number): string {
    return '/paatos/avustushaku/' + avustushakuId + '/hakemus/' + hakemusId
  }

  static publicLink(avustushakuId: number, userKey: string): string {
    return '/public/paatos/avustushaku/' + avustushakuId + '/hakemus/' + userKey
  }
}
