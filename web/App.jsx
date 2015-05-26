import React from 'react'
import Phantom from './phantom'

import Form from './Form.jsx'
import FormModel from './FormModel'

const model = new FormModel()
const formModelP = model.init()

formModelP.onValue((state) => {
  console.log("Updating UI with state:", state)
  React.render(
    <Form model={model} form={state.form} values={state.values} lang={state.lang} />,
    document.getElementById('container')
  )
})
