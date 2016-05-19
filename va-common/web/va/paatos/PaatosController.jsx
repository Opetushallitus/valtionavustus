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
    const environmentP =  Bacon.fromPromise(HttpUtil.get(`/environment`))
    var paatosDataP =  environmentP.flatMap(function(environment) {return Bacon.fromPromise(HttpUtil.get(environment["virkailija-server"].url + environment["paatos-path"] +`${hakemusId}`))})
    const initialStateTemplate = {
      paatosData: paatosDataP,
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
