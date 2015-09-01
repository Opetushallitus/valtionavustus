import React from 'react'
import Bacon from 'baconjs'

import style from './style/main.less'

export default class Login extends React.Component {
  render() {
    return (
      <h1>Hello, login.</h1>
    )
  }
}

const initialStateTemplate = {}

const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(function(state) {
  const properties = { model: state }
  React.render(React.createElement(Login, properties), document.getElementById('app'))
})

