import PolyfillBind from './polyfill-bind'

import React from 'react'
import Bacon from 'baconjs'
import qwest from 'qwest'
import _ from 'lodash'
import queryString from 'query-string'

import FormContainer from './form/FormContainer.jsx'
import FormModel from './FormModel'
import UrlCreator from './UrlCreator'

const sessionIdentifierForLocalStorageId = new Date().getTime()

function containsExistingEntityId(query) {
  return query.hakemus && query.hakemus.length > 0
}

function isFieldEnabled(saved, formModel, fieldId) {
  const disableExceptions = ["primary-email", "organization"]
  if (_.contains(disableExceptions, fieldId)) {
    return true
  }
  return saved
}

function onFieldValid(state, formModel, fieldId, newFieldValue) {
  if ("primary-email" === fieldId) {
    function hakemusIdIsAlreadyInUrl() {
      return state.saveStatus.hakemusId &&
        state.saveStatus.hakemusId.length > 0 &&
        window.location.href.indexOf(state.saveStatus.hakemusId) > -1
    }
    if (hakemusIdIsAlreadyInUrl()) {
      return
    }
    formModel.saveImmediately(function(newState, response) {
      const hakemusId = response.id
      newState.saveStatus.hakemusId = hakemusId
      const newUrl = formModel.formOperations.urlCreator.existingSubmissionEditUrl(newState.avustushaku.id, hakemusId)
      if (typeof (history.pushState) != "undefined") {
        history.pushState({}, window.title, newUrl);
     } else {
       window.location = newUrl
     }})
  }
}

function isSaveDraftAllowed(state) {
  return state.saveStatus.hakemusId && state.saveStatus.hakemusId.length > 0
}

function createUiStateIdentifier(state) {
  return state.form.id + "-" + sessionIdentifierForLocalStorageId
}

function existingFormApiUrl(avustusHakuId, hakemusId) { return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId }

function avustusHakuApiUrl(avustusHakuId) { return "/api/avustushaku/" + avustusHakuId }

const urlCreator = new UrlCreator({
    formApiUrl: function(avustusHakuId) { return "/api/form/" + avustusHakuId },
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

function printEntityId(state) {
  return state.saveStatus.hakemusId
}

const query = queryString.parse(location.search)
const avustusHakuP = Bacon.fromPromise(qwest.get(avustusHakuApiUrl(query.avustushaku || 1)))
const formP = avustusHakuP.flatMap(function(avustusHaku) {return Bacon.fromPromise(qwest.get(urlCreator.formApiUrl(avustusHaku.id)))})

function initialStateTransformation(initialState) {
  initialState.avustushaku = avustusHakuP
  initialState.saveStatus.hakemusId = query.hakemus
}

const model = new FormModel({
  "formOperations": {
    "containsExistingEntityId": containsExistingEntityId,
    "isFieldEnabled": isFieldEnabled,
    "onFieldValid": onFieldValid,
    "isSaveDraftAllowed": isSaveDraftAllowed,
    "createUiStateIdentifier": createUiStateIdentifier,
    "urlCreator": urlCreator,
    "printEntityId": printEntityId
  },
  "initialStateTransformation": initialStateTransformation,
  "formP": formP
})
const formModelP = model.init()

formModelP.onValue((state) => {
  console.log("Updating UI with state:", state)
  React.render(
    <FormContainer model={model}
                   state={state}
                   form={state.form}
                   infoElementValues={state.avustushaku}
                   clientSideValidation={state.clientSideValidation}
                   validationErrors={state.validationErrors}
                   configuration={state.configuration}
                   saveStatus={state.saveStatus} />,
    document.getElementById('app')
  )
})
