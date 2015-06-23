import PolyfillBind from './polyfill-bind'
import UrlCreator from './UrlCreator'
import React from 'react'
import _ from 'lodash'

import FormContainer from './FormContainer.jsx'
import FormModel from './FormModel'

const sessionIdentifierForLocalStorageId = new Date().getTime()

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
      const newUrl = formModel.formOperations.urlCreator.existingHakemusEditUrl(newState.avustushaku.id, hakemusId)
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

const urlCreator = new UrlCreator({
    formApiUrl: function(avustusHakuId) { return "/api/form/" + avustusHakuId },
    avustusHakuApiUrl: function(avustusHakuId) { return "/api/avustushaku/" + avustusHakuId },
    newHakemusApiUrl: function(avustusHakuId) { return "/api/avustushaku/" + avustusHakuId + "/hakemus" },
    existingHakemusApiUrl: function(avustusHakuId, hakemusId) { return "/api/avustushaku/" + avustusHakuId + "/hakemus/" + hakemusId },

    existingHakemusEditUrl: function(avustusHakuId, hakemusId) { return "/?avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId },
    existingHakemusPreviewUrl: function(avustusHakuId, hakemusId) { return "?preview=true&avustushaku=" + avustusHakuId + "&hakemus=" + hakemusId}
  }
)

const model = new FormModel({
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
