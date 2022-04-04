import React from 'react'
import ReactDOM from 'react-dom'
import * as Bacon from 'baconjs'
import queryString from 'query-string'
import HttpUtil from 'soresu-form/web/HttpUtil'
import FormController from 'soresu-form/web/form/FormController'
import {triggerFieldUpdatesForValidation} from 'soresu-form/web/form/FieldUpdateHandler'
import ResponseParser from 'soresu-form/web/form/ResponseParser'
import VaForm from './VaForm.jsx'
import VaUrlCreator from './VaUrlCreator'
import VaComponentFactory from 'soresu-form/web/va/VaComponentFactory'
import VaSyntaxValidator from 'soresu-form/web/va/VaSyntaxValidator'
import VaPreviewComponentFactory from 'soresu-form/web/va/VaPreviewComponentFactory'
import VaBudgetCalculator from 'soresu-form/web/va/VaBudgetCalculator'
import UrlCreator from 'soresu-form/web/form/UrlCreator'
import {HakijaAvustusHaku, InitialSaveStatus, StateLoopState, UrlContent} from 'soresu-form/web/form/types/Form'
import {Answers, Field} from 'soresu-form/web/va/types'

const sessionIdentifierForLocalStorageId = new Date().getTime()
const selvitysType = location.pathname.indexOf("loppuselvitys") !== -1 ? "loppuselvitys" : "valiselvitys"
const query = queryString.parse(location.search)
const selvitysId = query[selvitysType]
const showPreview = query.preview
const lang = query.lang

function containsExistingEntityId(urlContent: UrlContent): boolean {
  const query = urlContent.parsedQuery
  return query[selvitysType] && query[selvitysType].length > 0
}

function isFieldEnabled(saved: StateLoopState) {
  return saved
}

const responseParser = new ResponseParser({
  getFormAnswers: function(response) { return response.submission.answers }
})

interface SaveStatus extends InitialSaveStatus {
  hakemusId?: string
}

interface State {
  avustushaku: HakijaAvustusHaku
  saveStatus: SaveStatus
}

type Lang = 'fi' | 'sv'
type SelvitysType = 'valiselvitys' | 'loppuselvitys'

class SelvitysUrlCreator extends UrlCreator {
  constructor(selvitysType: SelvitysType) {
    function entityApiUrl(avustusHakuId: number, hakemusId: string, hakemusBaseVersion: any): string {
      return "/api/avustushaku/" + avustusHakuId + `/selvitys/${selvitysType}/` + hakemusId + (typeof hakemusBaseVersion === "number" ? `/${hakemusBaseVersion}` : '')
    }

    const attachmentDirectAccessUrl = function(state: State, field: Field) {
      const avustusHakuId = state.avustushaku.id
      const hakemusId = state.saveStatus.hakemusId
      return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + "/attachments/" + field.id
    }

    const existingSubmissionEditUrl = (avustushakuId: string | number, selvitysId: string | number, lang: Lang) =>
      `/avustushaku/${avustushakuId}/${selvitysType}?${selvitysType}=${selvitysId}&lang=${lang}`

    const urls = {
      formApiUrl: function (formId: string | number) {
        return "/api/form/" + formId
      },
      newEntityApiUrl: function () {
        // loadEntity creates
      },
      editEntityApiUrl: function (state: State) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        // @ts-expect-error
        return entityApiUrl(avustusHakuId, hakemusId, state.saveStatus.savedObject.version)
      },
      submitEntityApiUrl: function (state: State) {
        const baseEditUrl = this.editEntityApiUrl(state)
        const isChangeRequest = state.saveStatus.savedObject?.status === "pending_change_request"
        return baseEditUrl + (isChangeRequest ? "/change-request-response" : "/submit")
      },
      loadEntityApiUrl: function (urlContent: UrlContent) {
        const query = urlContent.parsedQuery
        const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
        const selvitysId = query[selvitysType]
        return entityApiUrl(avustusHakuId, selvitysId, undefined)
      },
      existingSubmissionEditUrl,
      existingSubmissionPreviewUrl: function (avustushakuId: string | number, selvitysId: string | number, lang: Lang) {
        return existingSubmissionEditUrl(avustushakuId, selvitysId, lang) + "&preview=true"
      },
      loadAttachmentsApiUrl: function (urlContent: UrlContent) {
        const query = urlContent.parsedQuery
        const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
        const hakemusId = query[selvitysType]
        return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId + "/attachments"
      },
      attachmentBaseUrl: function(state: State, field: Field) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        // @ts-expect-error
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
const budgetCalculator = new VaBudgetCalculator((descriptionField: Field, state: Answers | {}) => {
  triggerFieldUpdatesForValidation([descriptionField], state)
})

function onFieldUpdate(state: StateLoopState, field: Field) {
  if (field.fieldType === "moneyField" || field.fieldType === "vaSelfFinancingField") {
    budgetCalculator.handleBudgetAmountUpdate(state, field.id)
  }
}

function isNotFirstEdit(state: State) {
  return state.saveStatus.savedObject && state.saveStatus.savedObject.version && (state.saveStatus.savedObject.version > 1)
}

function isSaveDraftAllowed(state: State): boolean {
  if (!state.saveStatus.hakemusId) return false

  return state.saveStatus.hakemusId.length > 0
}

function createUiStateIdentifier(state: StateLoopState): string {
  // @ts-expect-error
  return state.configuration.form.id + "-" + sessionIdentifierForLocalStorageId
}

function printEntityId(state: State) {
  return state.saveStatus.hakemusId
}

const urlContent = { parsedQuery: query, location: location }
const avustusHakuId: string = VaUrlCreator.parseAvustusHakuId(urlContent)
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.avustusHakuApiUrl(avustusHakuId)))
const environmentP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.environmentConfigUrl()))

function initialStateTemplateTransformation(template: any) {
  template.avustushaku = avustusHakuP
  template.configuration.environment = environmentP
  template.saveStatus.hakemusId = query[selvitysType]
}

function onInitialStateLoaded(initialState: StateLoopState) {
  budgetCalculator.deriveValuesForAllBudgetElementsByMutation(initialState, {
    // @ts-expect-error
    reportValidationErrors: isNotFirstEdit(initialState)
  })
}

function initFormController() {
  const formP = avustusHakuP.flatMap(function(avustusHaku) {return Bacon.fromPromise(HttpUtil.get(urlCreator.formApiUrl(avustusHaku["form_" + selvitysType])))})
  const controller = new FormController({
    // @ts-expect-error
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
  // @ts-expect-error
  const stateProperty = controller.initialize(formOperations, initialValues, urlContent)
  // @ts-expect-error
  return { stateProperty: stateProperty, getReactComponent: function getReactComponent(state) {
    const isValiselvitys = selvitysType === 'valiselvitys'
    const selvitysUpdateable = state.saveStatus.savedObject && state.saveStatus.savedObject['selvitys-updatable']
    const valiselvitysNotUpdateable = isValiselvitys && selvitysUpdateable === false
    if (!showPreview && valiselvitysNotUpdateable) {
      const previewUrl = formOperations.urlCreator.existingSubmissionPreviewUrl(
        state.avustushaku.id,
        state.saveStatus.hakemusId,
        lang,
        state.token
      )

      window.location.href = previewUrl
    }

    return (
      <VaForm controller={controller}
              state={state}
              hakemusType={selvitysType}
              useBusinessIdSearch={false}
              isExpired={false} />)
  }}
}

function initSelvitys(avustusHakuId: string, hakemusId: string | number, selvitysType: SelvitysType, showPreview: string){
  HttpUtil.get("/api/avustushaku/" + avustusHakuId + `/selvitys/${selvitysType}/init/` + hakemusId).then(response => {
    const hakemusId = response.id
    const hakemusLang = lang ? lang : response.language
    window.location.href = `/avustushaku/${avustusHakuId}/${selvitysType}?${selvitysType}=${hakemusId}&lang=${hakemusLang}` + (showPreview === 'true' ? '&preview=true' : '')
  })
}


if(!selvitysId && query.hakemus) {
  initSelvitys(avustusHakuId, query.hakemus, selvitysType, showPreview)
}
else{
  const app = initFormController()
  app.stateProperty.onValue((state) => {
    ReactDOM.render(app.getReactComponent(state), document.getElementById('app'))
  })
}
