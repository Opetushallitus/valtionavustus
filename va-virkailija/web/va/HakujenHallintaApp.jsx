import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'

import TopBar from './TopBar.jsx'
import HakujenHallintaController from './HakujenHallintaController.jsx'

import virkailija from './style/virkailija.less'
import topbar from './style/topbar.less'

export default class AdminApp extends Component {
  render() {
    const state = this.props.state
    const environment =  state.environment
    const user = state.userInfo
    const username = user["first-name"] + " " + user["surname"]
    return (
      <section>
        <TopBar activeTab="admin" environment={environment} user={username}/>
        <section id="container">
        </section>
      </section>
    )
  }
}

const controller = new HakujenHallintaController()

const stateP = controller.initializeState()

stateP.onValue(function(state) {
  try {
    if (state.userInfo) {
      React.render(<AdminApp state={state} controller={controller}/>, document.getElementById('app'))
    } else {
      console.log('Not rendering yet, because state.userInfo not yet loaded.')
    }
  } catch (e) {
    console.log('Error from React.render with state', state, e)
  }
})
