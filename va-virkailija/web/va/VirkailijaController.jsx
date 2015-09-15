import Bacon from 'baconjs'
import _ from 'lodash'

import HttpUtil from 'va-common/web/HttpUtil.js'
import Dispatcher from 'va-common/web/Dispatcher'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState',
  selectHakemus: 'selectHakemus',
  updateHakemusArvio: 'updateHakemusArvio'
}

export default class VirkailijaController {
  initializeState() {
    const initialStateTemplate = {
      hakuData: Bacon.fromPromise(HttpUtil.get("/api/avustushaku/1")),
      userInfo: Bacon.fromPromise(HttpUtil.get("/api/userinfo")),
      translations: Bacon.fromPromise(HttpUtil.get("/translations.json")),
      selectedHakemus: undefined
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)

    initialState.onValue(state => {
      dispatcher.push(events.initialState, state)
    })

    return Bacon.update({},
      [dispatcher.stream(events.initialState)], this.onInitialState,
      [dispatcher.stream(events.selectHakemus)], this.onHakemusSelection,
      [dispatcher.stream(events.updateHakemusArvio)], this.onUpdateHakemusArvio)
  }

  onInitialState(emptyState, realInitialState) {
    var hakemusList = realInitialState.hakuData.hakemukset;
    if (hakemusList && !_.isEmpty(hakemusList)) {
      realInitialState.selectedHakemus = hakemusList[0]
    }
    return realInitialState
  }

  onHakemusSelection(state, hakemusToSelect) {
    state.selectedHakemus = hakemusToSelect
    return state
  }

  onUpdateHakemusArvio(state, updatedHakemus) {
    // TODO save to server
    return state
  }

  // Public API
  selectHakemus(hakemus) {
    return function() {
      dispatcher.push(events.selectHakemus, hakemus)
    }
  }

  setHakemusArvioStatus(hakemus, newStatus) {
    return function() {
      hakemus.arvio.status = newStatus
      dispatcher.push(events.updateHakemusArvio, hakemus)
    }
  }
}
