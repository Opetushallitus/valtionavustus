import Bacon from 'baconjs'
import queryString from 'query-string'
import _ from 'lodash'

import Dispatcher from './../form/Dispatcher'
import HttpUtil from './../form/HttpUtil'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState'
}

export default class VaFormVerificationController {
  constructor(props) {}

  initialize() {
    const query = queryString.parse(location.search)
    const queryParams = {
      lang: query.lang || 'fi',
      devel: query.devel || false,
      avustushakuId: query.avustushaku || 1,
      hakemusId: query.hakemus || 'unknown',
      tarkiste: query.tarkiste || 'unknown'
    }
    const translationsP = Bacon.fromPromise(HttpUtil.get("/translations.json"))

    const verifiedHakemusP = Bacon.fromPromise(HttpUtil.post("/api/avustushaku/" + queryParams.avustushakuId + "/hakemus/" + queryParams.hakemusId + "/verify/" + queryParams.tarkiste))
        .mapError(function(error) {
          console.warn("Failed verification:", error)
          return {}
        })

    const initialStateTemplate = {
      avustushakuId: queryParams.avustushakuId,
      hakemus: verifiedHakemusP,
      configuration: {
        preview: queryParams.preview,
        develMode: queryParams.devel,
        lang: queryParams.lang,
        translations: translationsP
      }
    }
    const initialState = Bacon.combineTemplate(initialStateTemplate)
    initialState.onValue(function(state) {
      dispatcher.push(events.initialState, state)
    })

    const stateProperty = Bacon.update({},
        [dispatcher.stream(events.initialState)], onInitialState)

    function onInitialState(initialState, loadedState) {
      return loadedState
    }

    return stateProperty.filter((value) => { return !_.isEmpty(value) })
  }
}
