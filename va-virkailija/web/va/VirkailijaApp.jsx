import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'

import Dispatcher from 'va-common/web/Dispatcher'

import TopBar from './TopBar.jsx'
import VirkailijaController from './VirkailijaController.jsx'
import AvustushakuSelector from './avustushaku/AvustushakuSelector.jsx'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusDetails from './hakemus-details/HakemusDetails.jsx'

import common from 'va-common/web/form/style/main.less'
import style from './style/main.less'
import topbar from './style/topbar.less'

export default class App extends Component {
  render() {
    const avustushaku = this.props.state.avustushaku.avustushaku
    const hakemusList = this.props.state.avustushaku.hakemukset
    const selectedHakemus = this.props.state.selectedHakemus
    return (
      <section>
        <TopBar user="Leena Koski" title="Hakemusten arviointi"/>
        <section id="container">
          <AvustushakuSelector avustushaku={avustushaku} controller={controller} />
          <HakemusListing hakemusList={hakemusList} selectedHakemus={selectedHakemus} controller={controller}/>
          <HakemusDetails avustushaku={avustushaku} hakemus={selectedHakemus}/>
        </section>
      </section>
    )
  }
}


const controller = new VirkailijaController()

const stateP = controller.initializeState()

stateP.onValue((state) => {
  try {
    if (state.avustushaku) {
      React.render(<App state={state} controller={controller}/>, document.getElementById('app'))
    }
  } catch (e) {
    console.log('Error from React.render with state', state, e)
  }
})
