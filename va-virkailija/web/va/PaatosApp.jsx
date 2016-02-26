import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'

import PaatosController from './PaatosController.jsx'

export default class PaatosApp extends Component {
  render() {
    const data = this.props.state.paatosData
    return (
        <section>
        <h1>Päätös</h1>
        <h2>{data.avustushaku.content.name.fi}</h2>
        <h2>{data.hakemus.arvio.status}</h2>
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
