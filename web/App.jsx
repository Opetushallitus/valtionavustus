import React from 'react'
import Phantom from './phantom'

import Form from './Form.jsx'
import FormModel from './FormModel'

const model = new FormModel()
const formModelP = model.init()

console.log("Got form model", formModelP)

formModelP.onValue((state) => {
  console.log("Updating UI with state:", state)
  React.render(
    <Form form={state.form} lang={state.lang} />,
    document.getElementById('container')
  )
})
