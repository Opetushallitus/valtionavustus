import React from 'react'
import Bacon from 'baconjs'

import HttpUtil from 'va-common/web/HttpUtil'

import virkailija from './style/virkailija.less'
import topbar from './style/topbar.less'
import style from './style/login.less'

import TopBar from './TopBar.jsx'

import queryString from 'query-string'

export default class Login extends React.Component {
  render() {
    const model = this.props.model
    const environment =  model.environment
    const query = queryString.parse(location.search)
    const errorMessage = (<div className="error">Sisäänkirjautuminen epäonnistui. Tarkista käyttäjänimi ja salasana</div>)
    const error = query.error == "true" ? errorMessage : (<div></div>)
    return (
      <div>
        <TopBar environment={environment} title="Hakemusten arviointi" />
        <section id="container">
          <h1>Kirjaudu sisään</h1>
          <form name="login" method="post">
            <div className="row">
              <label htmlFor="username">Tunnus</label>
              <input type="text" id="username" ref="nameInput" name="username" />
            </div>
            <div>
              <label htmlFor="password">Salasana</label>
              <input type="password" id="password" name="password" />
              <button type="submit">&gt;</button>
            </div>
          </form>
          {error}
        </section>
      </div>
    )
  }

  componentDidMount() {
    React.findDOMNode(this.refs.nameInput).focus()
  }
}

const environmentP = Bacon.fromPromise(HttpUtil.get("/environment"))

const initialStateTemplate = {
  environment: environmentP
}

const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(function(state) {
  const properties = { model: state }
  React.render(React.createElement(Login, properties), document.getElementById('app'))
})
