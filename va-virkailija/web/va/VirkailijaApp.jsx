import PolyfillBind from './../polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import Bacon from 'baconjs'
import _ from 'lodash'
import HttpUtil from './HttpUtil.js'
import Dispatcher from './Dispatcher.js'
import TopBar from './TopBar.jsx'
import React, { Component } from 'react'

import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusPreview from './hakemus-details/HakemusPreview.jsx'

import style from './style/main.less'
import topbar from './style/topbar.less'

export default class App extends Component {
  constructor(props) {
    super(props)
    const hakemusList = props.state.hakemusList
    const initialSelection = hakemusList ? hakemusList[0] : undefined
    this.state = { selectedHakemus: initialSelection }
  }

  render() {
    this.selectHakemus = this.selectHakemus.bind(this)
    const hakemusList = this.props.state.hakemusList
    const self = this
    return (
      <section>
        <TopBar title="Hakemusten arviointi"/>
        <section id="container">
          <HakemusListing hakemusList={hakemusList} handleRowClick={this.selectHakemus}/>
          <HakemusPreview hakemus={self.state.selectedHakemus}/>
        </section>
      </section>
    )
  }

  selectHakemus(hakemus) {
    return () => {
      this.setState({ selectedHakemus: hakemus })
    }
  }
}

const initialStateTemplate = {
  avustusHaku: 1, // TODO load all avustushaku objects and select one
  hakemusList: Bacon.fromPromise(HttpUtil.get("/api/avustushaku/1/hakemus")) // TODO use correct avustushaku id
}

const dispatcher = new Dispatcher()
const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(state => {
  dispatcher.push("initialState", state)
})

function onInitialState(emptyState, realInitialState) {
  return realInitialState
}

const stateP = Bacon.update({},
  [dispatcher.stream("initialState")], onInitialState)

stateP.onValue((state) => {
  try {
    React.render(<App state={state}/>, document.getElementById('app'))
  } catch (e) {
    console.log('Error from React.render with state', state, e)
  }
})
