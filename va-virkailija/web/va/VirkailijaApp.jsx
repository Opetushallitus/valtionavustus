import PolyfillBind from './../polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import Dispatcher from './Dispatcher.js'
import TopBar from './TopBar.jsx'
import React, { Component } from 'react'

import VirkailijaController from './VirkailijaController.jsx'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusPreview from './hakemus-details/HakemusPreview.jsx'

import style from './style/main.less'
import topbar from './style/topbar.less'

export default class App extends Component {
  render() {
    const avustusHakuWithHakemusList = this.props.state.avustusHakuWithHakemusList
    const avustushakuId = avustusHakuWithHakemusList ? avustusHakuWithHakemusList.avustushaku.id : undefined
    const hakemusList = avustusHakuWithHakemusList ? avustusHakuWithHakemusList.hakemukset : undefined
    const selectedHakemus = this.props.state.selectedHakemus
    return (
      <section>
        <TopBar title="Hakemusten arviointi"/>
        <section id="container">
          <HakemusListing hakemusList={hakemusList} selectedHakemus={selectedHakemus} controller={controller}/>
          <HakemusPreview avustushakuId={avustushakuId} hakemus={selectedHakemus}/>
        </section>
      </section>
    )
  }
}


const controller = new VirkailijaController()

const stateP = controller.initializeState()

stateP.onValue((state) => {
  try {
    React.render(<App state={state} controller={controller}/>, document.getElementById('app'))
  } catch (e) {
    console.log('Error from React.render with state', state, e)
  }
})
