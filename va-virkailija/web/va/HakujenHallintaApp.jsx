import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'

import TopBar from './TopBar.jsx'
import HakujenHallintaController from './HakujenHallintaController.jsx'
import HakuListing from './haku-list/HakuListing.jsx'
import HakuEdit from './haku-details/HakuEdit.jsx'

import virkailija from './style/virkailija.less'
import topbar from './style/topbar.less'
import admin from './style/admin.less'

export default class AdminApp extends Component {
  render() {
    const state = this.props.state
    const controller = this.props.controller
    const environment =  state.environment
    const selectedHaku = state.selectedHaku ? state.selectedHaku : {}
    return (
      <section>
        <TopBar activeTab="admin" environment={environment} state={state}/>
        <section id="container">
          <HakuListing hakuList={state.hakuList}
                       selectedHaku={state.selectedHaku}
                       controller={controller} />
          <HakuEdit avustushaku={selectedHaku}
                    controller={controller} />

        </section>
      </section>
    )
  }
}

const controller = new HakujenHallintaController()

const stateP = controller.initializeState()

stateP.onValue(function(state) {
  try {
    if (state.hakuList) {
      React.render(<AdminApp state={state} controller={controller}/>, document.getElementById('app'))
    } else {
      console.log('Not rendering yet, because state.hakuList not yet loaded.')
    }
  } catch (e) {
    console.log('Error from React.render with state', state, e)
  }
})
