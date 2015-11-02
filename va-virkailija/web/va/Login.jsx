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
    const errorMessage = (<div className="error">Sisäänkirjautuminen epäonnistui.</div>)
    const error = query.error == "true" ? errorMessage : (<div></div>)
    return (
      <div>
        <TopBar environment={environment}/>
        <section id="container">
          <h2>Sinulla ei ole oikeuksia valtionavustusjärjestelmään.</h2>
          <div className="row">{error}</div>
          <div className="row"><a href="/">Kirjaudu sisään</a></div>
        </section>
      </div>
    )
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
