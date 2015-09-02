import React from 'react'
import Bacon from 'baconjs'

import style from './style/main.less'
import topbar from './style/topbar.less'

import LoginTopbar from './LoginTopbar.jsx'

export default class Login extends React.Component {
  render() {
    return (
      <div>
        <LoginTopbar />
        <section id="container">
          <h1>Hello, login.</h1>
        </section>
      </div>
    )
  }
}

const initialStateTemplate = {}

const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(function(state) {
  const properties = { model: state }
  React.render(React.createElement(Login, properties), document.getElementById('app'))
})

