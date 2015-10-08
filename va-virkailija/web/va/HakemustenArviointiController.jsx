import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import queryString from 'query-string'

import HttpUtil from 'va-common/web/HttpUtil.js'
import Dispatcher from 'soresu-form/web/Dispatcher'

import HakemusStatuses from './hakemus-details/HakemusStatuses.js'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState',
  setFilter: 'setFilter',
  selectHakemus: 'selectHakemus',
  updateHakemusArvio: 'updateHakemusArvio',
  saveCompleted: 'saveCompleted',
  loadComments: 'loadcomments',
  commentsLoaded: 'commentsLoaded',
  addComment: 'addComment',
  scoresLoaded: 'scoresLoaded'
}

export default class HakemustenArviointiController {

  initializeState(avustushakuId) {
    this._bind('onInitialState', 'onHakemusSelection')

    const initialStateTemplate = {
      hakuData: Bacon.fromPromise(HttpUtil.get("/api/avustushaku/" + avustushakuId)),
      hakuFilter: {
        organization: "",
        name: "",
        status: HakemusStatuses.allStatuses()
      },
      userInfo: Bacon.fromPromise(HttpUtil.get("/api/userinfo")),
      translations: Bacon.fromPromise(HttpUtil.get("/translations.json")),
      avustushakuList: Bacon.fromPromise(HttpUtil.get("/api/avustushaku/")),
      selectedHakemus: undefined,
      saveStatus: {
        saveInProgress: false,
        saveTime: null,
        serverError: ""
      }
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)

    initialState.onValue(state => {
      dispatcher.push(events.initialState, state)
    })

    return Bacon.update(
      {},
      [dispatcher.stream(events.initialState)], this.onInitialState,
      [dispatcher.stream(events.selectHakemus)], this.onHakemusSelection,
      [dispatcher.stream(events.updateHakemusArvio)], this.onUpdateHakemusArvio,
      [dispatcher.stream(events.saveCompleted)], this.onSaveCompleted,
      [dispatcher.stream(events.loadComments)], this.onLoadComments,
      [dispatcher.stream(events.commentsLoaded)], this.onCommentsLoaded,
      [dispatcher.stream(events.addComment)], this.onAddComment,
      [dispatcher.stream(events.scoresLoaded)], this.onScoresLoaded,
      [dispatcher.stream(events.setFilter)], this.onFilterSet
    )
  }

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this))
  }

  static commentsUrl(state) {
    return "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + state.selectedHakemus.id + "/comments"
  }

  static scoresUrl(state, hakemus) {
    return "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + hakemus.id + "/scores"
  }

  onInitialState(emptyState, realInitialState) {
    const query = queryString.parse(location.search)
    if (query.showAll != "true") {
      realInitialState.hakuData.hakemukset = _.filter(realInitialState.hakuData.hakemukset, (hakemus) => {
        return hakemus.status === "submitted"
      })
    }
    var hakemusList = realInitialState.hakuData.hakemukset;
    if (hakemusList && !_.isEmpty(hakemusList)) {
      this.onHakemusSelection(realInitialState, hakemusList[0])
    }
    realInitialState.hakuData.form = Immutable(realInitialState.hakuData.form)
    return realInitialState
  }

  onHakemusSelection(state, hakemusToSelect) {
    state.selectedHakemus = hakemusToSelect
    this.loadScores(state, hakemusToSelect)
    return state
  }

  onUpdateHakemusArvio(state, updatedHakemus) {
    const updateUrl = "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + updatedHakemus.id + "/arvio"
    state.saveStatus.saveInProgress = true
    HttpUtil.post(updateUrl, updatedHakemus.arvio)
      .then(function(response) {
        if(response instanceof Object) {
          dispatcher.push(events.saveCompleted)
        }
        else {
          dispatcher.push(events.saveCompleted, "unexpected-save-error")
        }
      })
      .catch(function(response) {
        dispatcher.push(events.saveCompleted, "unexpected-save-error")
      })
    return state
  }

  onSaveCompleted(state, error) {
    state.saveStatus.saveInProgress = false
    if(error) {
      state.saveStatus.serverError = error
    }
    else {
      state.saveStatus.saveTime = new Date()
      state.saveStatus.serverError = ""
    }
    return state
  }

  onLoadComments(state) {
    if (!state.loadingComments) {
      state.loadingComments = true
      HttpUtil.get(HakemustenArviointiController.commentsUrl(state)).then(comments => {
        dispatcher.push(events.commentsLoaded, comments)
      })
    }
    return state
  }

  onCommentsLoaded(state, comments) {
    if (state.selectedHakemus) {
      state.selectedHakemus.comments = comments
    }
    state.loadingComments = false
    return state
  }

  onAddComment(state, newComment) {
    state.saveStatus.saveInProgress = true
    HttpUtil.post(HakemustenArviointiController.commentsUrl(state), { comment: newComment })
      .then(comments => {
        if(comments instanceof Object) {
          dispatcher.push(events.commentsLoaded, comments)
          dispatcher.push(events.saveCompleted)
        }
        else {
          dispatcher.push(events.saveCompleted, "unexpected-save-error")
        }
      })
      .catch(function(response) {
        dispatcher.push(events.saveCompleted, "unexpected-save-error")
      })
    return state
  }

  onFilterSet(state, newFilter) {
    state.hakuFilter[newFilter.filterId] = newFilter.filter
    return state
  }

  loadScores(state, hakemus) {
    HttpUtil.get(HakemustenArviointiController.scoresUrl(state, hakemus)).then(scores => {
      dispatcher.push(events.scoresLoaded, {hakemusId: hakemus.id, scores: scores})
    })
    return state
  }

  onScoresLoaded(state, hakemusIdWithScores) {
    const hakemusId = hakemusIdWithScores.hakemusId
    const relevantHakemus = _.find(state.hakuData.hakemukset, h => { return h.id === hakemusId })
    if (relevantHakemus) {
      relevantHakemus.scores = hakemusIdWithScores.scores
    }
    return state
  }

  // Public API
  selectHakemus(hakemus) {
    return function() {
      dispatcher.push(events.selectHakemus, hakemus)
    }
  }

  setFilter(filterId, newFilter) {
    dispatcher.push(events.setFilter, {filterId: filterId,
                                         filter: newFilter})
  }

  setHakemusArvioStatus(hakemus, newStatus) {
    return function() {
      hakemus.arvio.status = newStatus
      dispatcher.push(events.updateHakemusArvio, hakemus)
    }
  }

  setHakemusArvioBudgetGranted(hakemus, newBudgetGranted) {
    hakemus.arvio["budget-granted"] = newBudgetGranted
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  loadComments() {
    dispatcher.push(events.loadComments)
  }

  addComment(newComment) {
    dispatcher.push(events.addComment, newComment)
  }
}
