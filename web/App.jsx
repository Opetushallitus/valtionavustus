import PolyfillBind from './polyfill-bind'
import React from 'react'

import FormContainer from './FormContainer.jsx'
import FormModel from './FormModel'

function redirectToUniqueUrlOnValidCallback(state, fieldId, newFieldValue) {
  const hakemusId = state.saveStatus.hakemusId // in this temporary solution we assume that application is always saved before this redirect happens
  const newUrl = "/?avustushaku=" + state.avustushaku.id + "&hakemus=" + hakemusId
  if (typeof (history.pushState) != "undefined") {
    history.pushState({}, window.title, newUrl);
 } else {
   window.location = newUrl
 }}

const model = new FormModel({"onValidCallbacks":
  { "primary-email": [ redirectToUniqueUrlOnValidCallback ] }
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
