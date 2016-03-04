import PolyfillBind from '../../../../va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import HakemusArviointiStatuses from './../hakemus-details/HakemusArviointiStatuses.js'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'
import PaatosController from './PaatosController.jsx'
import style from './paatos.less'

const parsedRoute = new RouteParser('/paatos/avustushaku/:avustushaku_id/hakemus/:hakemus_id').match(location.pathname)
const controller = new PaatosController()

controller.initializeState(parsedRoute).onValue((state) => {
  try {
    if (state.paatosData) {
      ReactDOM.render(<PaatosApp state={state} controller={controller}/>, document.getElementById('app'))
    } else {
      console.log('Not rendering yet, because state.paatosData not yet loaded.')
    }
  } catch (e) {
    console.log('Error from ReactDOM.render with state', state, e)
  }
})

export default class PaatosApp extends Component {
  render() {
    const {hakemus, avustushaku, roles} = this.props.state.paatosData
    const decisionStatus = hakemus.arvio.status
    const selectedRoleId = hakemus.arvio['presenter-role-id']
    const role = selectedRoleId ? roles.find(role => role.id === selectedRoleId) : roles[0]

    return (
        <section>
          <header>
            <div><img src="/img/logo.png" width="200"/></div>
            <div>Päätös</div>
            <div>{hakemus['register-number']}</div>
          </header>
          <div>
            <section className="section">
              <h2>Asia</h2>
              <div className="content">
                VALTIONAVUSTUKSEN MYÖNTÄMINEN<br/>
                {avustushaku.content.name.fi}
              </div>
            </section>
            <section className="section">
              <h2>Taustaa</h2>
              <div className="content">
                <i>[TODO: TAUSTAA, HAKUKOHTAINEN]</i>
              </div>
            </section>
            {decisionStatus == 'rejected' ? <RejectedDecision hakemus={hakemus} role={role}/> :
                <AcceptedDecision hakemus={hakemus} avustushaku={avustushaku} role={role}/>}
          </div>
        </section>
    )
  }
}

const AcceptedDecision = ({hakemus, avustushaku, role}) => {
  const answers = hakemus.answers
  const iban = InputValueStorage.readValues(answers, 'iban')[0].value
  const bic = InputValueStorage.readValues(answers, 'bic')[0].value
  return (
      <section>
        <section className="section">
          <h2>Päätös</h2>
          <div className="content">
            <p>Opetushallitus on päättänyt myöntää valtionavustusta seuraavasti:</p>
            <p>Hakija: {hakemus['organization-name']}<br/>
              Hanke: {hakemus['project-name']}</p>
            <p>Opetushallitus hyväksyy avustuksen saajan valtionavustukseen oikeuttavina menoina xx euroa.
              Valtionavustuksena tästä myönnetään {(100 - avustushaku.content['self-financing-percentage'])} %
              eli {hakemus.arvio['budget-granted']} euroa</p>
          </div>
        </section>
        <section className="section">
          <h2>Päätöksen perustelut</h2>
          <div className="content">
            {hakemus.arvio.perustelut}
          </div>
        </section>
        <section className="section">
          <h2>Avustuksen maksu</h2>
          <div className="content">
            <p>Avustus maksetaan hakijan ilmoittamalle pankkitilille: <strong>{iban}, {bic}</strong></p>
            <p><i>[TODO: AVUSTUKSEN MAKSU, VAKIOTEKSTI]</i></p>
          </div>
        </section>
        <section className="section">
          <h2>Avustuksen käyttö</h2>
          <div className="content">
            <i>[TODO: AVUSTUKSEN KÄYTTÖ, HAKUKOHTAINEN]</i>
          </div>
        </section>
        <section className="section">
          <h2>Käyttöoikeudet</h2>
          <div className="content">
            <i>[TODO: KÄYTTÖIKEUDET, TULEEKO MUKAAN?]</i>
          </div>
        </section>
        <section className="section">
          <h2>Selvitysvelvollisuus</h2>
          <div className="content">
            <i>[TODO: SELVITYSVELVOLLISUUS, HAKUKOHTAINEN]</i>
          </div>
        </section>
        <section className="section">
          <h2>Valtionavustuksen käyttöaika</h2>
          <div className="content">
            <i>[TODO: KÄYTTÖAIKA, HAKUKOHTAINEN]</i>
          </div>
        </section>
        <section className="section">
          <h2>Lisätietoja</h2>
          <div className="content">
            <p>Lisätietoja antaa: {role.name} &lt;{role.email}&gt;</p>
            <p><i>[TODO: LISÄTIETOJA, HAKUKOHTAINEN]</i></p>
          </div>
        </section>
        <section className="section">
          <h2>LIITTEET</h2>
          <div className="content">
            <i>[TODO: LIITTEET, HAKUKOHTAINEN]</i>
          </div>
        </section>
      </section>
  )
}

const RejectedDecision = ({hakemus, role}) =>
    <section>
      <section className="section">
        <h2>Päätös</h2>
        <div className="content">
          <p>Opetushallitus on päättänyt olla myöntämättä valtionavustusta seuraavasti:</p>
          <p>Hakija: {hakemus['organization-name']}<br/>
            Hanke: {hakemus['project-name']}</p>
        </div>
      </section>
      <section className="section">
        <h2>Päätöksen perustelut</h2>
        <div className="content">
          {hakemus.arvio.perustelut}
        </div>
      </section>
      <section className="section">
        <h2>Lisätietoja</h2>
        <div className="content">
          <p>Lisätietoja antaa: {role.name} &lt;{role.email}&gt;</p>
          <p><i>[TODO: LISÄTIETOJA, HAKUKOHTAINEN]</i></p>
        </div>
      </section>
      <section className="section">
        <h2>LIITTEET</h2>
        <div className="content">
          <i>[TODO: LIITTEET, HAKUKOHTAINEN]</i>
        </div>
      </section>
    </section>

