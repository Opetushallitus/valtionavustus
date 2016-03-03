import PolyfillBind from '../../../../va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import HakemusArviointiStatuses from './../hakemus-details/HakemusArviointiStatuses.js'

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
    const paatosData = this.props.state.paatosData
    const hakemus = paatosData.hakemus
    const avustushaku = paatosData.avustushaku
    const decisionStatus = hakemus.arvio.status
    return (
        <section>
          <header>
            <div><img src="/img/logo.png" width="200" /></div>
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
            {decisionStatus == 'rejected' ? <RejectedDecision hakemus={hakemus}/> :
                <AcceptedDecision hakemus={hakemus} avustushaku={avustushaku}/>}
          </div>
        </section>
    )
  }
}

class AcceptedDecision extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
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
            <h2>Avustuksen maksu</h2>
            <div className="content">
              Pankkitili: xx
            </div>
          </section>
        </section>
    )
  }
}

class RejectedDecision extends Component {
  render() {
    const hakemus = this.props.hakemus
    return (
        <section>
          <section className="section">
            <h2>Päätös</h2>
            <div className="content">
              <p>Opetushallitus on päättänyt olla myöntämättä valtionavustusta seuraavasti:</p>
              <p>Hakija: {hakemus['organization-name']}<br/>
                Hanke: {hakemus['project-name']}</p>
            </div>
          </section>
        </section>
    )
  }
}
