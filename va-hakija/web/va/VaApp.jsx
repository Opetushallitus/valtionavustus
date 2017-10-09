import "soresu-form/web/polyfills"

import React from "react"
import ReactDOM from "react-dom"
import Bacon from "baconjs"
import _ from "lodash"
import queryString from "query-string"

import HttpUtil from "soresu-form/web/HttpUtil"

import FormController from "soresu-form/web/form/FormController"
import FieldUpdateHandler from "soresu-form/web/form/FieldUpdateHandler"
import ResponseParser from "soresu-form/web/form/ResponseParser"

import VaForm from "./VaForm.jsx"
import VaUrlCreator from "./VaUrlCreator"
import VaComponentFactory from "va-common/web/va/VaComponentFactory"
import VaSyntaxValidator from "va-common/web/va/VaSyntaxValidator"
import VaPreviewComponentFactory from "va-common/web/va/VaPreviewComponentFactory"
import {BudgetItemElement} from "va-common/web/va/VaBudgetComponents.jsx"
import VaBudgetCalculator from "va-common/web/va/VaBudgetCalculator"

const sessionIdentifierForLocalStorageId = new Date().getTime()

function containsExistingEntityId(urlContent) {
  const query = urlContent.parsedQuery
  return query.hakemus && query.hakemus.length > 0
}

function isFieldEnabled(saved, fieldId) {
  return saved
}

const responseParser = new ResponseParser({
  getFormAnswers: function(response) { return response.submission.answers }
})

const urlCreator = new VaUrlCreator()
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

const query = queryString.parse(location.search)
const urlContent = { parsedQuery: query, location: location }
const develMode =  query.devel === "true"
const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.avustusHakuApiUrl(avustusHakuId)))
const environmentP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.environmentConfigUrl()))

function initialStateTemplateTransformation(template) {
  template.avustushaku = avustusHakuP
  template.configuration.environment = environmentP
  template.saveStatus.hakemusId = query.hakemus
}

function isEmptyOrReopenedHakemus(savedObject) {
  return !savedObject || (savedObject.status === "pending_change_request" || savedObject.status === "officer_edit")
}

function onInitialStateLoaded(initialState) {
  budgetCalculator.deriveValuesForAllBudgetElementsByMutation(initialState, {
    reportValidationErrors: isNotFirstEdit(initialState)
  })
  if (initialState.avustushaku.phase !== "current" &&
      !initialState.configuration.preview &&
      !isEmptyOrReopenedHakemus(initialState.saveStatus.savedObject)) {
    window.location.href = urlCreator.existingSubmissionPreviewUrl(
      initialState.avustushaku.id,
      initialState.saveStatus.hakemusId,
      initialState.configuration.lang,
      initialState.configuration.develMode)
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
  return { stateProperty: stateProperty, getReactComponent: function(state) {
    return <VaForm showBusinessIdSearch={true} controller={controller} state={state} hakemusType="hakemus"/>
  }}
}

function initAppController() {
  return initVaFormController()
}

const app = initAppController()
app.stateProperty.onValue((state) => {
  if (develMode) {
    console.log("Updating UI with state:", state)
  }
  ReactDOM.render(app.getReactComponent(state), document.getElementById("app"))
})
