import PolyfillBind from './polyfill-bind'
import React from 'react'

import FormContainer from './FormContainer.jsx'
import FormModel from './FormModel'

const model = new FormModel()
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
