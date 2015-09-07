import Bacon from 'baconjs'
import _ from 'lodash'
import HttpUtil from './HttpUtil.js'

import Dispatcher from './Dispatcher.js'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState',
  selectHakemus: 'selectHakemus'
}

export default class VirkailijaController {
  initializeState() {
    const initialStateTemplate = {
      avustusHaku: 1, // TODO load all avustushaku objects and select one
      hakemusList: Bacon.fromPromise(HttpUtil.get("/api/avustushaku/1/hakemus")), // TODO use correct avustushaku id
      selectedHakemus: undefined
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)

    initialState.onValue(state => {
      dispatcher.push(events.initialState, state)
    })

    return Bacon.update({},
      [dispatcher.stream(events.initialState)], this.onInitialState,
      [dispatcher.stream(events.selectHakemus)], this.onHakemusSelection)
  }

  onInitialState(emptyState, realInitialState) {
    if (realInitialState.hakemusList && !_.isEmpty(realInitialState.hakemusList)) {
      realInitialState.selectedHakemus = realInitialState.hakemusList[0]
    }
    return realInitialState
  }

  onHakemusSelection(state, hakemusToSelect) {
    state.selectedHakemus = hakemusToSelect
    return state
  }

  // Public API
  selectHakemus(hakemus) {
    return function() {
      dispatcher.push(events.selectHakemus, hakemus)
    }
  }
}
