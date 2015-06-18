import PolyfillBind from './polyfill-bind'
import UrlCreator from './UrlCreator'
import React from 'react'
import _ from 'lodash'

import FormContainer from './FormContainer.jsx'
import FormModel from './FormModel'

function redirectToUniqueUrlOnValidCallback(state, formModel, fieldId, newFieldValue) {
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
    const newUrl = UrlCreator.existingHakemusEditUrl(newState.avustushaku.id, hakemusId)
    if (typeof (history.pushState) != "undefined") {
      history.pushState({}, window.title, newUrl);
   } else {
     window.location = newUrl
   }})
}

function isFieldEnabled(saved, formModel, fieldId) {
  const disableExceptions = ["primary-email", "organization"]
  if (_.contains(disableExceptions, fieldId)) {
    return true
  }
  return saved
}

function isSaveDraftAllowed(state) {
  return state.saveStatus.hakemusId && state.saveStatus.hakemusId.length > 0
}

const model = new FormModel({
  "formOperations": {
    "isFieldEnabled": isFieldEnabled,
    "isSaveDraftAllowed": isSaveDraftAllowed,
    "onValidCallbacks":
    { "primary-email": [ redirectToUniqueUrlOnValidCallback ] }
  }
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
