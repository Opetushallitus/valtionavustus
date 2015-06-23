import PolyfillBind from './polyfill-bind'
import UrlCreator from './UrlCreator'
import React from 'react'
import _ from 'lodash'

import FormContainer from './FormContainer.jsx'
import FormModel from './FormModel'

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
    formModel.saveImmediately(function(newState) {
      const hakemusId = newState.saveStatus.hakemusId
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

const urlCreator = new UrlCreator({
    formApiUrl: function(avustusHakuId) { return "/api/form/" + avustusHakuId },
    avustusHakuApiUrl: function(avustusHakuId) { return "/api/avustushaku/" + avustusHakuId },
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
    existingSubmissionPreviewUrl: function(avustusHakuId, hakemusId) { return "?preview=true&avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId}
  }
)

const model = new FormModel({
  "containsExistingEntityId": containsExistingEntityId,
  "isFieldEnabled": isFieldEnabled,
  "onFieldValid": onFieldValid,
  "isSaveDraftAllowed": isSaveDraftAllowed,
  "createUiStateIdentifier": createUiStateIdentifier,
  "urlCreator": urlCreator
})
const formModelP = model.init()

formModelP.onValue((state) => {
  console.log("Updating UI with state:", state)
  React.render(
    <FormContainer model={model}
                   form={state.form}
                   avustushaku={state.avustushaku}
                   clientSideValidation={state.clientSideValidation}
                   validationErrors={state.validationErrors}
                   configuration={state.configuration}
                   saveStatus={state.saveStatus} />,
    document.getElementById('app')
  )
})
