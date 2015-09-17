import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import HttpUtil from 'va-common/web/HttpUtil.js'
import Dispatcher from 'va-common/web/Dispatcher'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState',
  selectHaku: 'selectHaku'
}

export default class HakujenHallintaController {
  initializeState() {
    const initialStateTemplate = {
      hakuList: Bacon.fromPromise(HttpUtil.get("/api/avustushaku")),
      userInfo: Bacon.fromPromise(HttpUtil.get("/api/userinfo")),
      environment: Bacon.fromPromise(HttpUtil.get("/environment")),
      selectedHaku: undefined
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)

    initialState.onValue(state => {
      dispatcher.push(events.initialState, state)
    })

    return Bacon.update(
      {},
      [dispatcher.stream(events.initialState)], this.onInitialState,
      [dispatcher.stream(events.selectHaku)], this.onHakuSelection
    )
  }

  onInitialState(emptyState, realInitialState) {
    var hakuList = realInitialState.hakuList;
    if (hakuList && !_.isEmpty(hakuList)) {
      realInitialState.selectedHaku = hakuList[0]
    }
    return realInitialState
  }

  onHakuSelection(state, hakuToSelect) {
    state.selectedHaku = hakuToSelect
    return state
  }

  // Public API
  selectHaku(hakemus) {
    return function() {
      dispatcher.push(events.selectHaku, hakemus)
    }
  }
}
