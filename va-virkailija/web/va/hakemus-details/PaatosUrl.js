export default class PaatosUrl {
  static previewLink(avustushakuId, hakemusId) {
    return "/paatos/avustushaku/" + avustushakuId + "/hakemus/" + hakemusId
  }

  static publicLink(avustushakuId, userKey) {
    return "/public/paatos/avustushaku/" + avustushakuId + "/hakemus/" + userKey
  }
}
