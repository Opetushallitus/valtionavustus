import UrlCreator from './../form/UrlCreator'


export default class VaUrlCreator extends UrlCreator {
  constructor() {
    function existingFormApiUrl(avustusHakuId, hakemusId) {
      return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId
    }
    const urls = {
      formApiUrl: function (formId) {
        return "/api/form/" + formId
      },
      newEntityApiUrl: function (state) {
        return "/api/avustushaku/" + state.avustushaku.id + "/hakemus"
      },
      existingFormApiUrl: function (state) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        return existingFormApiUrl(avustusHakuId, hakemusId)
      },
      existingFormApiUrlFromQuery: function (query) {
        const avustusHakuId = query.avustushaku || 1
        const hakemusId = query.hakemus
        return existingFormApiUrl(avustusHakuId, hakemusId)
      },
      existingSubmissionEditUrl: function (avustusHakuId, hakemusId, lang, devel) {
        return "/?avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId + "&lang=" + lang + (devel ? "&devel=true" : "")
      },
      existingSubmissionPreviewUrl: function (state) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        return "?preview=true&avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId
      }
    }
    super(urls)
  }

  avustusHakuApiUrl(avustusHakuId) {
    return "/api/avustushaku/" + avustusHakuId
  }
}
