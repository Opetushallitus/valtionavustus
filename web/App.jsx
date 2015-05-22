import React from 'react'
import Bacon from 'baconjs'
import Phantom from './phantom'

import Form from './Form.jsx'
import {GET, POST, DELETE} from './request'

const formP = Bacon.fromCallback(GET, "/api/form")
const languageP = Bacon.constant('fi')

const appState = Bacon.combineTemplate({
  form: formP,
  lang: languageP
})

appState.onValue((state) => {
  console.log("Got state:", state)
  React.render(
    <Form form={state.form} lang={state.lang} />,
    document.getElementById('container')
  )
})
