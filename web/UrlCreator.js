export default class UrlCreator {
  static formApiUrl(avustusHakuId) { return "/api/form/" + avustusHakuId }
  static avustusHakuApiUrl(avustusHakuId) { return "/api/avustushaku/" + avustusHakuId }
  static newHakemusApiUrl(avustusHakuId) { return "/api/avustushaku/" + avustusHakuId + "/hakemus" }
  static existingHakemusApiUrl(avustusHakuId, hakemusId) { return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId }

  static existingHakemusEditUrl(avustusHakuId, hakemusId) { return "/?avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId }
  static existingHakemusPreviewUrl(avustusHakuId, hakemusId) { return "?preview=true&avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId}
}