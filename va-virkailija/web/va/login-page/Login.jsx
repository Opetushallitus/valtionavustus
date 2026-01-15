import React from 'react'
import { createRoot } from 'react-dom/client'
import * as Bacon from 'baconjs'
import queryString from 'query-string'

import HttpUtil from 'soresu-form/web/HttpUtil'

import 'soresu-form/web/form/style/theme.css'
import '../style/virkailija.css'
import './login.css'
import * as styles from '../common-components/Header.module.css'
import ErrorBoundary from '../common-components/ErrorBoundary'

export default class Login extends React.Component {
  render() {
    const model = this.props.model
    const environment = model.environment
    const opintopolku = environment.opintopolku
    const query = queryString.parse(location.search)
    const errorMessage = <div className="error">Sisäänkirjautuminen epäonnistui.</div>
    const notPermittedMessage = (
      <div className="error">Sinulla ei ole oikeuksia valtionavustusjärjestelmään.</div>
    )
    const error = query.error === 'true' ? errorMessage : undefined
    const notPermitted = query['not-permitted'] === 'true' ? notPermittedMessage : undefined
    return (
      <div>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <div className={styles.headerLinks}>
              <img
                src="/img/logo-176x50@2x.png"
                width="142"
                height="40"
                alt="Opetushallitus / Utbildningsstyrelsen"
              />
            </div>
            <div className={styles.headerControls}></div>
          </div>
        </div>
        <section id="container">
          <div className="row">{notPermitted}</div>
          <div className="row">{error}</div>
          <div hidden={notPermitted} className="row">
            <a href="/">Kirjaudu sisään</a>
          </div>
          <div hidden={!notPermitted} className="row">
            <a href={opintopolku.url + opintopolku['permission-request']}>Ano lisää oikeuksia</a>{' '}
            tai <a href="/login/logout">kirjaudu ulos</a> opintopolusta
          </div>
        </section>
      </div>
    )
  }
}

const environmentP = Bacon.fromPromise(HttpUtil.get('/environment'))

const initialStateTemplate = {
  environment: environmentP,
}

const initialState = Bacon.combineTemplate(initialStateTemplate)

const app = document.getElementById('app')
const root = createRoot(app)

initialState.onValue(function (state) {
  const properties = { model: state }
  root.render(
    <ErrorBoundary>
      <Login {...properties} />
    </ErrorBoundary>
  )
})
