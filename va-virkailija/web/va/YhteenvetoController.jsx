import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import queryString from 'query-string'
import RouteParser from 'route-parser'

import HttpUtil from 'va-common/web/HttpUtil.js'
import Dispatcher from 'soresu-form/web/Dispatcher'

import HakemusArviointiStatuses from './hakemus-details/HakemusArviointiStatuses.js'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState',
  setFilter: 'setFilter',
  setSorter: 'setSorter'
}

export default class YhteenvetoController {
  initializeState(parsedRoute) {
    const avustushakuId = parsedRoute["avustushaku_id"]
    if (!avustushakuId) {
      return Bacon.constant({})
    }
    const savedSearchId = parsedRoute["saved_search_id"]

    this._bind('onInitialState')

    const initialStateTemplate = {
      hakuData: Bacon.fromPromise(HttpUtil.get("/api/avustushaku/" + avustushakuId)),
      savedSearchQuery: Bacon.fromPromise(HttpUtil.get("/api/avustushaku/" + avustushakuId + "/searches/" + savedSearchId)),
      hakemusFilter: {
        organization: "",
        name: "",
        status: HakemusArviointiStatuses.allStatuses()
      },
      hakemusSorter: [
        {field: "score", order: "desc"}
      ],
      userInfo: Bacon.fromPromise(HttpUtil.get("/api/userinfo"))
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)

    initialState.onValue(state => {
      dispatcher.push(events.initialState, state)
    })

    return Bacon.update(
      {},
      [dispatcher.stream(events.initialState)], this.onInitialState,
      [dispatcher.stream(events.setFilter)], this.onFilterSet,
      [dispatcher.stream(events.setSorter)], this.onSorterSet
    )
  }

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this))
  }

  onInitialState(emptyState, realInitialState) {
    const savedSearchQuery = realInitialState.savedSearchQuery
    if (!_.isArray(savedSearchQuery["hakemus-ids"])) {
      console.log('Error: cannot process saved search query', savedSearchQuery)
      throw new Error("Cannot process saved search query", savedSearchQuery)
    }
    realInitialState.hakuData.hakemukset = _.map(savedSearchQuery["hakemus-ids"], id => {
      return _.find(realInitialState.hakuData.hakemukset, h => { return h.id === id})
    })
    return realInitialState
  }

  onFilterSet(state, newFilter) {
    state.hakemusFilter[newFilter.filterId] = newFilter.filter
    return state
  }

  onSorterSet(state, newSorter) {
    state.hakemusSorter = newSorter
    return state
  }


  // Public API
  setFilter(filterId, newFilter) {
    dispatcher.push(events.setFilter, {filterId: filterId,
                                       filter: newFilter})
  }

  setSorter(newSorter) {
    dispatcher.push(events.setSorter, newSorter)
  }

  selectHakemus() {}
}
