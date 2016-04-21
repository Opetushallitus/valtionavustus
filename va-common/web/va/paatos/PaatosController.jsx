import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import queryString from 'query-string'
import RouteParser from 'route-parser'

import HttpUtil from '../../HttpUtil.js'
import Dispatcher from '../../../../soresu-form/web/Dispatcher'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState'
}

export default class PaatosController {
  initializeState(parsedRoute) {
    const hakemusId = parsedRoute["hakemus_id"]
    this._bind('onInitialState')
    const initialStateTemplate = {
      paatosData: Bacon.fromPromise(HttpUtil.get(`/api/avustushaku/paatos/${hakemusId}`)),
      translations: Bacon.fromPromise(HttpUtil.get("/translations.json")).map(Immutable)
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)

    initialState.onValue(state => {
      dispatcher.push(events.initialState, state)
    })

    return Bacon.update(
        {},
        [dispatcher.stream(events.initialState)], this.onInitialState
    )
  }

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this))
  }

  onInitialState(emptyState, realInitialState) {
    return realInitialState
  }
}
