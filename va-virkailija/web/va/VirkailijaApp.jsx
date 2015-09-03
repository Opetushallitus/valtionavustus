import PolyfillBind from './../polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import Bacon from 'baconjs'
import _ from 'lodash'
import HttpUtil from './HttpUtil.js'
import Dispatcher from './Dispatcher.js'

import React, { Component } from 'react'

export default class App extends Component {
  render() {
    const hakemusList = this.props.state.hakemusList
    const hakemusElements = _.map(hakemusList, this.renderHakemusListItem(hakemusList))
    return (
      <section>
        <ul>
          {hakemusElements}
        </ul>
      </section>
    )
  }

  renderHakemusListItem(hakemusList) {
    return function(hakemus) {
      const key = hakemusList.indexOf(hakemus)
      return <li key={key}>{JSON.stringify(hakemus)}</li>
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
