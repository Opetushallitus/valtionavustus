import RouteParser from 'route-parser'

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
        const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
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
      },
      loadAttachmentsApiUrl: function (urlContent) {
        const query = urlContent.parsedQuery
        const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
        const hakemusId = query.hakemus
        return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + "/attachments"
      },
      attachmentBaseUrl: function(state, field) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        const hakemusVersion = state.saveStatus.savedObject.version
        return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + "/" + hakemusVersion + "/attachments/" + field.id
      },
      attachmentDeleteUrl: function(state, field) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + "/attachments/" + field.id
      }
    }
    super(urls)
  }

  avustusHakuApiUrl(avustusHakuId) {
    return "/api/avustushaku/" + avustusHakuId
  }

  environmentConfigUrl() {
    return "/environment"
  }

  chooseInitialLanguage(urlContent) {
    const langQueryParam = urlContent.parsedQuery.lang
    const hostname = urlContent.location.hostname
    return langQueryParam ? langQueryParam : hostname.indexOf("statsunderstod.oph.fi") > -1 ? "sv" : "fi"
  }

  static parseAvustusHakuId(urlContent) {
    const location = urlContent.location
    const pathname = location.pathname
    const parsedAvustusHakuIdObjectFi = new RouteParser('/avustushaku/:avustushaku_id/*ignore').match(pathname)
    const parsedAvustusHakuIdObjectSv = new RouteParser('/statsunderstod/:avustushaku_id/*ignore').match(pathname)
    const fallbackHakuId = urlContent.parsedQuery.avustushaku // Leave this here for now in case of old ?avustushaku=1 URLs still around
    return parsedAvustusHakuIdObjectFi.avustushaku_id || parsedAvustusHakuIdObjectSv.avustushaku_id || fallbackHakuId
  }
}
