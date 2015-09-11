import React from 'react'
import Bacon from 'baconjs'

import common from 'va-common/web/form/style/main.less'
import topbar from './style/topbar.less'
import style from './style/login.less'

import TopBar from './TopBar.jsx'

import TextButton from 'va-common/web/form/component/TextButton.jsx'

import queryString from 'query-string'

export default class Login extends React.Component {
  render() {
    const lang = "fi"
    const query = queryString.parse(location.search)
    const translations = {"login": {"fi": ">"}}
    const errorMessage = (<div className="error">Sisäänkirjautuminen epäonnistui. Tarkista käyttäjänimi ja salasana</div>)
    const error = query.error == "true" ? errorMessage : (<div></div>)
    return (
      <div>
        <TopBar title="Virkailija" />
        <section id="container">
          <h1>Kirjaudu sisään</h1>
          {error}
          <form name="login" method="post">
            <label htmlFor="username">Tunnus:</label>
            <input type="text" id="username" ref="nameInput" name="username" />
            <label htmlFor="password">Salasana:</label>
            <input type="password" id="password" name="password" />
            <TextButton type="submit" translations={translations} translationKey="login" lang={lang} />
          </form>
        </section>
      </div>
    )
  }

  componentDidMount() {
    React.findDOMNode(this.refs.nameInput).focus()
  }
}

const initialStateTemplate = {}

const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(function(state) {
  const properties = { model: state }
  React.render(React.createElement(Login, properties), document.getElementById('app'))
})
