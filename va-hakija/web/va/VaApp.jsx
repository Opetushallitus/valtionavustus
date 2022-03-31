import ReactDOM from "react-dom"
import * as Bacon from "baconjs"
import queryString from "query-string"

import HttpUtil from "soresu-form/web/HttpUtil"

import FormController from "soresu-form/web/form/FormController.ts"
import {triggerFieldUpdatesForValidation} from "soresu-form/web/form/FieldUpdateHandler"
import ResponseParser from "soresu-form/web/form/ResponseParser"

import VaForm from "./VaForm.jsx"
import VaUrlCreator from "./VaUrlCreator"
import VaComponentFactory from "soresu-form/web/va/VaComponentFactory"
import VaSyntaxValidator from "soresu-form/web/va/VaSyntaxValidator.ts"
import VaPreviewComponentFactory from "soresu-form/web/va/VaPreviewComponentFactory"
import VaBudgetCalculator from "soresu-form/web/va/VaBudgetCalculator"

const sessionIdentifierForLocalStorageId = new Date().getTime()

function containsExistingEntityId(urlContent) {
  const query = urlContent.parsedQuery
  return query.hakemus && query.hakemus.length > 0
}

function isFieldEnabled(saved) {
  return saved
}

const responseParser = new ResponseParser({
  getFormAnswers: function(response) { return response.submission.answers }
})

const urlCreator = new VaUrlCreator()
const budgetCalculator = new VaBudgetCalculator((descriptionField, state) => {
  triggerFieldUpdatesForValidation([descriptionField], state)
})

function onFieldUpdate(state, field) {
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

const query = queryString.parse(location.search)
const urlContent = { parsedQuery: query, location: location }
const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.avustusHakuApiUrl(avustusHakuId)))
const environmentP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.environmentConfigUrl()))
const normalizedHakemusP = Bacon.fromPromise(HttpUtil.get(`/api/avustushaku/${avustusHakuId}/hakemus/${query.hakemus}/normalized`).catch(e => undefined))
const muutoshakemuksetP = Bacon.fromPromise(HttpUtil.get(`/api/avustushaku/${avustusHakuId}/hakemus/${query.hakemus}/muutoshakemus`).catch(e => []))


function initialStateTemplateTransformation(template) {
  template.avustushaku = avustusHakuP
  template.normalizedHakemus = normalizedHakemusP
  template.muutoshakemukset = muutoshakemuksetP
  template.configuration.environment = environmentP
  template.saveStatus.hakemusId = query.hakemus
  template.token = query.token
}

function isOfficerEdit(savedObject) {
  const params = new URLSearchParams(window.location.search)
  const hasOfficerToken = params.has('officerToken')
  return savedObject.status === "officer_edit" && hasOfficerToken
}

function isEmptyOrReopenedHakemus(savedObject) {
  return !savedObject || savedObject.status === "pending_change_request" || isOfficerEdit(savedObject)
}

function onInitialStateLoaded(initialState) {
  budgetCalculator.deriveValuesForAllBudgetElementsByMutation(initialState, {
    reportValidationErrors: isNotFirstEdit(initialState)
  })
  const modifyApplication = query["modify-application"]
  if (!modifyApplication && initialState.avustushaku.phase !== "current" &&
      !initialState.configuration.preview &&
      !isEmptyOrReopenedHakemus(initialState.saveStatus.savedObject)) {
    window.location.href = urlCreator.existingSubmissionPreviewUrl(
      initialState.avustushaku.id,
      initialState.saveStatus.hakemusId,
      initialState.configuration.lang,
      initialState.token,
      initialState.isTokenValid)
  }
}

function initVaFormController() {
  const formP = avustusHakuP.flatMap(function(avustusHaku) {return Bacon.fromPromise(HttpUtil.get(urlCreator.formApiUrl(avustusHaku.form)))})
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
  return { stateProperty: stateProperty, getReactComponent: function getReactComponent(state) {
    return <VaForm controller={controller} state={state} hakemusType="hakemus" useBusinessIdSearch={true} refuseGrant={urlContent.parsedQuery["refuse-grant"]} modifyApplication={urlContent.parsedQuery["modify-application"]}/>
  }}
}

function initAppController() {
  return initVaFormController()
}

const app = initAppController()
app.stateProperty.onValue((state) => {
  ReactDOM.render(app.getReactComponent(state), document.getElementById("app"))
})
