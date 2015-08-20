import UrlCreator from './../form/UrlCreator'


export default class VaUrlCreator extends UrlCreator {
  constructor() {
    function entityApiUrl(avustusHakuId, hakemusId, hakemusBaseVersion) {
      return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + (typeof hakemusBaseVersion == "number" ? "/" + hakemusBaseVersion : "")
    }
    const urls = {
      formApiUrl: function (formId) {
        return "/api/form/" + formId
      },
      newEntityApiUrl: function (state) {
        return "/api/avustushaku/" + state.avustushaku.id + "/hakemus"
      },
      editEntityApiUrl: function (state) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        return entityApiUrl(avustusHakuId, hakemusId, state.saveStatus.savedObject.version)
      },
      loadEntityApiUrl: function (urlContent) {
        const query = urlContent.parsedQuery
        const avustusHakuId = query.avustushaku || 1
        const hakemusId = query.hakemus
        return entityApiUrl(avustusHakuId, hakemusId)
      },
      existingSubmissionEditUrl: function (avustusHakuId, hakemusId, lang, devel) {
        return "/avustushaku/" + avustusHakuId + "/nayta?avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId + "&lang=" + lang + (devel ? "&devel=true" : "")
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
