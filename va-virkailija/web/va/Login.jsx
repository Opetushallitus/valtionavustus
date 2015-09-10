import React from 'react'
import Bacon from 'baconjs'

import common from 'va-common/web/form/style/main.less'
import style from './style/main.less'
import topbar from './style/topbar.less'

import TopBar from './TopBar.jsx'

export default class Login extends React.Component {
  render() {
    const invisibleButton= {
      position: 'absolute',
      left: '-9999px',
      width: '1px',
      height: '1px'
    }

    return (
      <div>
        <TopBar title="Virkailija" />
        <section id="container">
          <h1>Kirjaudu sisään</h1>
          <form name="login" method="post">
            <label htmlFor="username">Tunnus:</label>
            <input type="text" id="username" name="username" />
            <label htmlFor="password">Salasana:</label>
            <input type="password" id="username" name="password" />
            <input type="submit" style={invisibleButton} tabIndex="-1"/>
          </form>
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

