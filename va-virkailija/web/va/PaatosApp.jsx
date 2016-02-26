import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import HakemusArviointiStatuses from './hakemus-details/HakemusArviointiStatuses.js'

import PaatosController from './PaatosController.jsx'
import style from './paatos.less'

export default class PaatosApp extends Component {
  render() {
    const data = this.props.state.paatosData
    return (
        <section>
          <header>
            <h1>Päätös</h1>
          </header>
          <div className="body">
            <section className="section">
              <h2>Asia</h2>
              <div className="content">
                {data.avustushaku.content.name.fi}
              </div>
            </section>
            <section className="section">
              <h2>Päätös</h2>
              <div className="content">
                <p>{HakemusArviointiStatuses.statusToFI(data.hakemus.arvio.status)}</p>
                <p>Hakija: {data.hakemus['organization-name']}<br/>
                  Hanke: {data.hakemus['project-name']}</p>

                <p>Opetushallitus hyväksyy avustuksen saajan valtionavustukseen oikeuttavina menoina xx euroa.
                  Valtionavustuksena tästä myönnetään {(100 - data.avustushaku.content['self-financing-percentage'])} %
                  eli {data.hakemus.arvio['budget-granted']} euroa</p>

              </div>
            </section>
            <section className="section">
              <h2>Avustuksen maksu</h2>
              <div className="content">
                Pankkitili: xx
              </div>
            </section>
          </div>
          <h2>{HakemusArviointiStatuses.statusToFI(data.hakemus.arvio.status)}</h2>
        </section>
    )
  }
}

const parsedRoute = new RouteParser('/paatos/avustushaku/:avustushaku_id/hakemus/:hakemus_id').match(location.pathname)
const controller = new PaatosController()
const stateP = controller.initializeState(parsedRoute)

stateP.onValue((state) => {
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
