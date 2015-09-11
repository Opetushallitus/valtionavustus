import PolyfillBind from 'va-common/web/polyfill-bind.js'

import ConsolePolyfill from 'console-polyfill'
import React from 'react'
import Bacon from 'baconjs'
import _ from 'lodash'
import queryString from 'query-string'

import HttpUtil from 'va-common/web/HttpUtil'

import FormController from './../form/FormController'
import FieldUpdateHandler from './../form/FieldUpdateHandler.js'
import ResponseParser from './../form/ResponseParser'
import JsUtil from 'va-common/web/form/JsUtil.js'

import VaForm from './VaForm.jsx'
import VaUrlCreator from './VaUrlCreator'
import VaComponentFactory from './VaComponentFactory.js'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'
import {BudgetItemElement} from 'va-common/web/va/VaBudgetComponents.jsx'
import {VaBudgetCalculator} from './VaBudgetCalculator.js'

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
  if (field.displayAs === "moneyField") {
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
const develQueryParam =  query.devel || false
const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(urlCreator.avustusHakuApiUrl(avustusHakuId)))
const environmentP = Bacon.fromPromise(HttpUtil.get(urlCreator.environmentConfigUrl()))

function initialStateTemplateTransformation(template) {
  template.avustushaku = avustusHakuP
  template.configuration.environment = environmentP
  template.saveStatus.hakemusId = query.hakemus
}

function onInitialStateLoaded(initialState) {
  budgetCalculator.populateBudgetCalculatedValuesForAllBudgetFields(initialState, isNotFirstEdit(initialState))
}

function initVaFormController() {
  const formP = avustusHakuP.flatMap(function(avustusHaku) {return Bacon.fromPromise(HttpUtil.get(urlCreator.formApiUrl(avustusHaku.form)))})
  const controller = new FormController({
    "initialStateTemplateTransformation": initialStateTemplateTransformation,
    "onInitialStateLoaded": onInitialStateLoaded,
    "formP": formP,
    "customComponentFactory": new VaComponentFactory(),
    "customPreviewComponentFactory": new VaPreviewComponentFactory()
  })
  const formOperations = {
    "chooseInitialLanguage": urlCreator.chooseInitialLanguage,
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
  const initialValues = {"language": urlCreator.chooseInitialLanguage(urlContent)}
  const stateProperty = controller.initialize(formOperations, initialValues, urlContent)
  return { stateProperty: stateProperty, getReactComponent: function(state) {
    return <VaForm controller={controller} state={state} develQueryParam={develQueryParam}/>
  }}
}

function initAppController() {
  return initVaFormController()
}

const app = initAppController()
app.stateProperty.onValue((state) => {
  if (develQueryParam) {
    console.log("Updating UI with state:", state)
  }
  try {
    React.render(app.getReactComponent(state), document.getElementById('app'))
  } catch (e) {
    console.log('Error from React.render with state', state, e)
  }
})
