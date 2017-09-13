import RouteParser from 'route-parser'

import UrlCreator from 'soresu-form/web/form/UrlCreator'

export default class VaUrlCreator extends UrlCreator {
  constructor() {
    function entityApiUrl(avustusHakuId, hakemusId, hakemusBaseVersion) {
      return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + (typeof hakemusBaseVersion == "number" ? "/" + hakemusBaseVersion : "")
    }

    const attachmentDirectAccessUrl = function(state, field) {
      const avustusHakuId = state.avustushaku.id
      const hakemusId = state.saveStatus.hakemusId
      return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + "/attachments/" + field.id
    }

    const existingSubmissionEditUrl = (avustusHakuId, hakemusId, lang, devel) =>
      `/avustushaku/${avustusHakuId}/nayta?avustushaku=${avustusHakuId}&hakemus=${hakemusId}&lang=${lang}${devel ? "&devel=true" : ""}`

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
      submitEntityApiUrl: function (state) {
        const baseEditUrl = this.editEntityApiUrl(state)
        const isChangeRequest = state.saveStatus.savedObject.status === "pending_change_request"
        const isVirkailijaEdit = state.saveStatus.savedObject.status === "officer_edit"
        return baseEditUrl + (isChangeRequest ? "/change-request-response" : (isVirkailijaEdit ? "/officer-edit-submit" : "/submit"))
      },
      loadEntityApiUrl: function (urlContent) {
        const query = urlContent.parsedQuery
        const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
        const hakemusId = query.hakemus
        return entityApiUrl(avustusHakuId, hakemusId)
      },
      existingSubmissionEditUrl,
      existingSubmissionPreviewUrl: function (avustushakuId, hakemusId, lang, devel) {
        return existingSubmissionEditUrl(avustushakuId, hakemusId, lang, devel) + "&preview=true"
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
      organisationInfoUrl: function (state) {
        return "/api/organisations/?organisation-id="
      },
      attachmentDownloadUrl: attachmentDirectAccessUrl,
      attachmentDeleteUrl: attachmentDirectAccessUrl
    }
    super(urls)
  }

  static avustusHakuApiUrl(avustusHakuId) {
    return "/api/avustushaku/" + avustusHakuId
  }

  static environmentConfigUrl() {
    return "/environment"
  }

  static chooseInitialLanguage(urlContent) {
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
