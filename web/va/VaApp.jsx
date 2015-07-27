import PolyfillBind from './../polyfill-bind'

import ConsolePolyfill from 'console-polyfill'
import React from 'react'
import Bacon from 'baconjs'
import _ from 'lodash'
import queryString from 'query-string'

import FormController from './../form/FormController'
import FieldUpdateHandler from './../form/FieldUpdateHandler.js'
import UrlCreator from './../form/UrlCreator'
import ResponseParser from './../form/ResponseParser'
import JsUtil from './../form/JsUtil.js'
import HttpUtil from './../form/HttpUtil'

import VaForm from './VaForm.jsx'
import VaComponentFactory from './VaComponentFactory.js'
import VaPreviewComponentFactory from './VaPreviewComponentFactory.js'
import {BudgetItemElement} from './VaBudgetComponents.jsx'
import {VaBudgetCalculator} from './VaBudgetCalculator.js'

const sessionIdentifierForLocalStorageId = new Date().getTime()

function containsExistingEntityId(query) {
  return query.hakemus && query.hakemus.length > 0
}

function isFieldEnabled(saved, fieldId) {
  const disableExceptions = ["primary-email", "organization"]
  if (_.contains(disableExceptions, fieldId)) {
    return true
  }
  return saved
}

const responseParser = new ResponseParser({
      getFormAnswers: function(response) { return response.submission.answers }
})

const urlCreator = new UrlCreator({
    formApiUrl: function(formId) { return "/api/form/" + formId },
    newEntityApiUrl: function(state) { return "/api/avustushaku/" + state.avustushaku.id + "/hakemus" },
    existingFormApiUrl: function(state) {
      const avustusHakuId = state.avustushaku.id
      const hakemusId = state.saveStatus.hakemusId
      return existingFormApiUrl(avustusHakuId, hakemusId)
    },
    existingFormApiUrlFromQuery: function(query) {
      const avustusHakuId = query.avustushaku || 1
      const hakemusId = query.hakemus
      return existingFormApiUrl(avustusHakuId, hakemusId)
    },

    existingSubmissionEditUrl: function(avustusHakuId, hakemusId) { return "/?avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId },
    existingSubmissionPreviewUrl: function(state) {
      const avustusHakuId = state.avustushaku.id
      const hakemusId = state.saveStatus.hakemusId
      return "?preview=true&avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId
    }
  }
)

function onFieldValid(formController, state, field, newFieldValue) {
  const fieldId = field.id
  if ("primary-email" === fieldId) {
    function hakemusIdIsAlreadyInUrl() {
      return state.saveStatus.hakemusId &&
        state.saveStatus.hakemusId.length > 0 &&
        window.location.href.indexOf(state.saveStatus.hakemusId) > -1
    }
    if (hakemusIdIsAlreadyInUrl()) {
      return
    }
    formController.saveImmediately(function(newState, response) {
      const hakemusId = response.id
      newState.saveStatus.hakemusId = hakemusId
      const newUrl = urlCreator.existingSubmissionEditUrl(newState.avustushaku.id, hakemusId)
      if (typeof (history.pushState) != "undefined") {
        history.pushState({}, window.title, newUrl);
     } else {
       window.location = newUrl
     }})
  }
}

function onFieldUpdate(state, field, newFieldValue) {
  if (field.displayAs === "moneyField") {
    VaBudgetCalculator.handleBudgetAmountUpdate(state, field.id)
  }
}

function isSaveDraftAllowed(state) {
  return state.saveStatus.hakemusId && state.saveStatus.hakemusId.length > 0
}

function onSaveCompletedCallback(currentStateInUi, savedStateOnServer) {
  currentStateInUi.saveStatus.hakemusId = savedStateOnServer.saveStatus.hakemusId
}

function createUiStateIdentifier(state) {
  return state.form.id + "-" + sessionIdentifierForLocalStorageId
}

function existingFormApiUrl(avustusHakuId, hakemusId) { return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId }

function avustusHakuApiUrl(avustusHakuId) { return "/api/avustushaku/" + avustusHakuId }

function printEntityId(state) {
  return state.saveStatus.hakemusId
}

const query = queryString.parse(location.search)
const develQueryParam =  query.devel || false
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(avustusHakuApiUrl(query.avustushaku || 1)))

function initialStateTemplateTransformation(template) {
  template.avustushaku = avustusHakuP
  template.saveStatus.hakemusId = query.hakemus
}

function onInitialStateLoaded(initialState) {
  const editingExistingApplication = isSaveDraftAllowed(initialState)
  VaBudgetCalculator.populateBudgetCalculatedValuesForAllBudgetFields(initialState, editingExistingApplication)
}

function initVaForm() {
  const formP = avustusHakuP.flatMap(function(avustusHaku) {console.log(avustusHaku);return Bacon.fromPromise(HttpUtil.get(urlCreator.formApiUrl(avustusHaku.form)))})
  const controller = new FormController({
    "initialStateTemplateTransformation": initialStateTemplateTransformation,
    "onInitialStateLoaded": onInitialStateLoaded,
    "formP": formP,
    "customComponentFactory": new VaComponentFactory(),
    "customPreviewComponentFactory": new VaPreviewComponentFactory()
  })
  const stateProperty = controller.initialize({
    "containsExistingEntityId": containsExistingEntityId,
    "isFieldEnabled": isFieldEnabled,
    "onFieldUpdate": onFieldUpdate,
    "onFieldValid": _.partial(onFieldValid, controller),
    "isSaveDraftAllowed": isSaveDraftAllowed,
    "onSaveCompletedCallback": onSaveCompletedCallback,
    "createUiStateIdentifier": createUiStateIdentifier,
    "urlCreator": urlCreator,
    "responseParser": responseParser,
    "printEntityId": printEntityId
  }, query)
  return {stateProperty: stateProperty, getReactComponent: function(state) {
    return <VaForm controller={controller} state={state} develQueryParam={develQueryParam}/>
  }}
}

const app = initVaForm()
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
