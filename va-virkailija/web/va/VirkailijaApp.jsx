import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'

import Dispatcher from 'va-common/web/Dispatcher'

import TopBar from './TopBar.jsx'
import VirkailijaController from './VirkailijaController.jsx'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusDetails from './hakemus-details/HakemusDetails.jsx'

import virkailija from './style/virkailija.less'
import topbar from './style/topbar.less'
import style from './style/main.less'

export default class App extends Component {
  render() {
    const hakuData = this.props.state.hakuData
    const avustushaku = hakuData.avustushaku
    const hakemusList = hakuData.hakemukset
    const selectedHakemus = this.props.state.selectedHakemus
    const translations = this.props.state.translations
    const user = this.props.state.userInfo
    const username = user["first-name"] + " " + user["surname"]
    return (
      <section>
        <TopBar environment={hakuData.environment} user={username} title="Hakemusten arviointi"/>
        <section id="container">
          <HakemusListing ophShareSum={hakuData["budget-oph-share-sum"]}
                          hakemusList={hakemusList}
                          selectedHakemus={selectedHakemus}
                          avustushaku={avustushaku}
                          controller={controller} />
          <HakemusDetails hakuData={hakuData}
                          avustushaku={avustushaku}
                          hakemus={selectedHakemus}
                          translations={translations}
                          controller={controller}/>
        </section>
      </section>
    )
  }
}


const controller = new VirkailijaController()

const stateP = controller.initializeState()

stateP.onValue((state) => {
  try {
    if (state.hakuData && state.userInfo) {
      React.render(<App state={state} controller={controller}/>, document.getElementById('app'))
    } else {
      console.log('Not rendering yet, because state.hakuData not yet loaded.')
    }
  } catch (e) {
    console.log('Error from React.render with state', state, e)
  }
})
