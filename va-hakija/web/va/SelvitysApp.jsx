import PolyfillBind from 'va-common/web/polyfill-bind.js'

import ConsolePolyfill from 'console-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import Bacon from 'baconjs'
import _ from 'lodash'
import queryString from 'query-string'

import HttpUtil from 'va-common/web/HttpUtil'

import FormController from 'soresu-form/web/form/FormController'
import FieldUpdateHandler from 'soresu-form/web/form/FieldUpdateHandler.js'
import ResponseParser from 'soresu-form/web/form/ResponseParser'

import VaForm from './VaForm.jsx'
import VaUrlCreator from './VaUrlCreator'
import VaComponentFactory from 'va-common/web/va/VaComponentFactory.js'
import VaSyntaxValidator from 'va-common/web/va/VaSyntaxValidator'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'
import {BudgetItemElement} from 'va-common/web/va/VaBudgetComponents.jsx'
import VaBudgetCalculator from 'va-common/web/va/VaBudgetCalculator'
import UrlCreator from 'soresu-form/web/form/UrlCreator'

const sessionIdentifierForLocalStorageId = new Date().getTime()
const selvitysType = location.pathname.indexOf("loppuselvitys")!=-1 ? "loppuselvitys" : "valiselvitys"
const query = queryString.parse(location.search)
var selvitysId = query[selvitysType]
var showPreview = query.preview
const lang = query.lang

function containsExistingEntityId(urlContent) {
  const query = urlContent.parsedQuery
  return query[selvitysType] && query[selvitysType].length > 0
}

function isFieldEnabled(saved, fieldId) {
  return saved
}

const responseParser = new ResponseParser({
  getFormAnswers: function(response) { return response.submission.answers }
})

class SelvitysUrlCreator extends UrlCreator {
  constructor(selvitysType) {
    function entityApiUrl(avustusHakuId, hakemusId, hakemusBaseVersion) {
      return "/api/avustushaku/" + avustusHakuId + `/selvitys/${selvitysType}/` + hakemusId + (typeof hakemusBaseVersion == "number" ? "/" + hakemusBaseVersion : "")
    }

    const attachmentDirectAccessUrl = function(state, field) {
      const avustusHakuId = state.avustushaku.id
      const hakemusId = state.saveStatus.hakemusId
      return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + "/attachments/" + field.id
    }

    const existingSubmissionEditUrl = (avustushakuId, selvitysId, lang, devel) =>
      `/avustushaku/${avustushakuId}/${selvitysType}?${selvitysType}=${selvitysId}&lang=${lang}${devel ? "&devel=true" : ""}`

    const urls = {
      formApiUrl: function (formId) {
        return "/api/form/" + formId
      },
      newEntityApiUrl: function (state) {
        // loadEntity creates
      },
      editEntityApiUrl: function (state) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        return entityApiUrl(avustusHakuId, hakemusId, state.saveStatus.savedObject.version)
      },
      submitEntityApiUrl: function (state) {
        const baseEditUrl = this.editEntityApiUrl(state)
        const isChangeRequest = state.saveStatus.savedObject.status === "pending_change_request"
        return baseEditUrl + (isChangeRequest ? "/change-request-response" : "/submit")
      },
      loadEntityApiUrl: function (urlContent) {
        const query = urlContent.parsedQuery
        const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
        var selvitysId = query[selvitysType]
        return entityApiUrl(avustusHakuId, selvitysId)
      },
      existingSubmissionEditUrl,
      existingSubmissionPreviewUrl: function (avustushakuId, selvitysId, lang, devel) {
        return existingSubmissionEditUrl(avustushakuId, selvitysId, lang, devel) + "&preview=true"
      },
      loadAttachmentsApiUrl: function (urlContent) {
        const query = urlContent.parsedQuery
        const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
        const hakemusId = query[selvitysType]
        return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + "/attachments"
      },
      attachmentBaseUrl: function(state, field) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        const hakemusVersion = state.saveStatus.savedObject.version
        return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + "/" + hakemusVersion + "/attachments/" + field.id
      },
      attachmentDownloadUrl: attachmentDirectAccessUrl,
      attachmentDeleteUrl: attachmentDirectAccessUrl
    }
    super(urls)
  }
}

const urlCreator = new SelvitysUrlCreator(selvitysType)
const budgetCalculator = new VaBudgetCalculator((descriptionField, state) => {
  FieldUpdateHandler.triggerFieldUpdatesForValidation([descriptionField], state)
})

function onFieldUpdate(state, field, newFieldValue) {
  if (field.fieldType === "moneyField" || field.fieldType === "vaSelfFinancingField") {
    budgetCalculator.handleBudgetAmountUpdate(state, field.id)
  }
}

function isNotFirstEdit(state) {
  return state.saveStatus.savedObject && state.saveStatus.savedObject.version && (state.saveStatus.savedObject.version > 1)
}

function isSaveDraftAllowed(state) {
  return state.saveStatus.hakemusId && state.saveStatus.hakemusId.length > 0
}

function createUiStateIdentifier(state) {
  return state.configuration.form.id + "-" + sessionIdentifierForLocalStorageId
}

function printEntityId(state) {
  return state.saveStatus.hakemusId
}

const urlContent = { parsedQuery: query, location: location }
const develMode =  query.devel === 'true'
const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.avustusHakuApiUrl(avustusHakuId)))
const environmentP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.environmentConfigUrl()))

function initialStateTemplateTransformation(template) {
  template.avustushaku = avustusHakuP
  template.configuration.environment = environmentP
  template.saveStatus.hakemusId = query[selvitysType]
}

function onInitialStateLoaded(initialState) {
  budgetCalculator.deriveValuesForAllBudgetElementsByMutation(initialState, {
    reportValidationErrors: isNotFirstEdit(initialState)
  })
}

function initFormController() {
  const formP = avustusHakuP.flatMap(function(avustusHaku) {return Bacon.fromPromise(HttpUtil.get(urlCreator.formApiUrl(avustusHaku["form_" + selvitysType])))})
  const controller = new FormController({
    "initialStateTemplateTransformation": initialStateTemplateTransformation,
    "onInitialStateLoaded": onInitialStateLoaded,
    "formP": formP,
    "customComponentFactory": new VaComponentFactory(),
    "customPreviewComponentFactory": new VaPreviewComponentFactory(),
    "customFieldSyntaxValidator": VaSyntaxValidator
  })
  const formOperations = {
    "chooseInitialLanguage": VaUrlCreator.chooseInitialLanguage,
    "containsExistingEntityId": containsExistingEntityId,
    "isFieldEnabled": isFieldEnabled,
    "onFieldUpdate": onFieldUpdate,
    "isSaveDraftAllowed": isSaveDraftAllowed,
    "isNotFirstEdit": isNotFirstEdit,
    "createUiStateIdentifier": createUiStateIdentifier,
    "urlCreator": urlCreator,
    "responseParser": responseParser,
    "printEntityId": printEntityId
  }
  const initialValues = {language: VaUrlCreator.chooseInitialLanguage(urlContent)}
  const stateProperty = controller.initialize(formOperations, initialValues, urlContent)
  return { stateProperty: stateProperty, getReactComponent: function(state) {
    return <VaForm controller={controller} state={state} hakemusType={selvitysType}/>
  }}
}

function initSelvitys(avustusHakuId, hakemusId, selvitysType, showPreview){
  HttpUtil.get("/api/avustushaku/" + avustusHakuId + `/selvitys/${selvitysType}/init/` + hakemusId).then(response => {
    const hakemusId = response.id
    const hakemusLang = lang ? lang : response.language
    window.location.href = `/avustushaku/${avustusHakuId}/${selvitysType}?${selvitysType}=${hakemusId}&lang=${hakemusLang}` + (showPreview == 'true' ? '&preview=true' : '')
  })
}


if(!selvitysId && query.hakemus) {
  initSelvitys(avustusHakuId,query.hakemus, selvitysType, showPreview)
}
else{
  const app = initFormController()
  app.stateProperty.onValue((state) => {
    if (develMode) {
      console.log("Updating UI with state:", state)
    }
    ReactDOM.render(app.getReactComponent(state), document.getElementById('app'))
  })
}
