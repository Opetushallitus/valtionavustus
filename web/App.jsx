import PolyfillBind from './polyfill-bind'
import React from 'react'

import FormContainer from './FormContainer.jsx'
import FormModel from './FormModel'

const model = new FormModel()
const formModelP = model.init()

formModelP.onValue((state) => {
  console.log("Updating UI with state:", state)
  React.render(
    <FormContainer model={model} form={state.form} values={state.values} lang={state.lang} />,
    document.getElementById('container')
  )
})
