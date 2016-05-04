import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import queryString from 'query-string'
import RouteParser from 'route-parser'

import Dispatcher from 'soresu-form/web/Dispatcher'
import DateUtil from 'soresu-form/web/form/DateUtil'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import FieldUpdateHandler from 'soresu-form/web/form/FieldUpdateHandler'

import HttpUtil from 'va-common/web/HttpUtil'
import VaSyntaxValidator from 'va-common/web/va/VaSyntaxValidator'

import HakemusArviointiStatuses from './hakemus-details/HakemusArviointiStatuses.js'

const dispatcher = new Dispatcher()

const events = {
  beforeUnload: 'beforeUnload',
  initialState: 'initialState',
  reRender: 'reRender',
  setFilter: 'setFilter',
  setSorter: 'setSorter',
  selectHakemus: 'selectHakemus',
  closeHakemus: 'closeHakemus',
  updateHakemusArvio: 'updateHakemusArvio',
  saveHakemusArvio: 'saveHakemusArvio',
  updateHakemusStatus: 'updateHakemusStatus',
  saveCompleted: 'saveCompleted',
  loadComments: 'loadcomments',
  commentsLoaded: 'commentsLoaded',
  addComment: 'addComment',
  scoresLoaded: 'scoresLoaded',
  setOverriddenAnswerValue: 'setOverriddenAnswerValue',
  changeRequestsLoaded: 'changeRequestsLoaded',
  attachmentVersionsLoaded: 'attachmentVersionsLoaded',
  setScore: 'setScore',
  toggleOthersScoresDisplay: 'toggleOthersScoresDisplay',
  gotoSavedSearch: 'gotoSavedSearch',
  toggleHakemusFilter:'toggleHakemusFilter',
  togglePersonSelect:'togglePersonSelect',
  clearFilters:'clearFilters'
}

export default class HakemustenArviointiController {

  initializeState(avustushakuId,evaluator) {
    this._bind('onInitialState', 'onHakemusSelection', 'onUpdateHakemusStatus', 'onUpdateHakemusArvio', 'onSaveHakemusArvio', 'onBeforeUnload')
    this.autoSaveHakemusArvio = _.debounce(function(updatedHakemus){ dispatcher.push(events.saveHakemusArvio, updatedHakemus) }, 3000)

    Bacon.fromEvent(window, "beforeunload").onValue(function(event) {
      // For some odd reason Safari always displays a dialog here
      // But it's probably safer to always save the document anyway
      dispatcher.push(events.beforeUnload)
    })

    const initialStateTemplate = {
      avustushakuList: Bacon.fromPromise(HttpUtil.get("/api/avustushaku/?status=published&status=resolved")),
      hakuData: Bacon.fromPromise(HttpUtil.get("/api/avustushaku/" + avustushakuId)),
      hakemusFilter: {
        answers:[],
        isOpen:false,
        name: "",
        openQuestions:[],
        status: HakemusArviointiStatuses.allStatuses(),
        organization: "",
        roleIsOpen:false,
        evaluator:evaluator,
        presenter:undefined
      },
      hakemusSorter: [
        {field: "score", order: "desc"}
      ],
      personSelectHakemusId:undefined,
      selectedHakemus: undefined,
      showOthersScores: false,
      saveStatus: {
        saveInProgress: false,
        saveTime: null,
        serverError: ""
      },
      translations: Bacon.fromPromise(HttpUtil.get("/translations.json")).map(Immutable),
      userInfo: Bacon.fromPromise(HttpUtil.get("/api/userinfo"))
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)

    initialState.onValue(state => {
      dispatcher.push(events.initialState, state)
    })

    return Bacon.update(
      {},
      [dispatcher.stream(events.beforeUnload)], this.onBeforeUnload,
      [dispatcher.stream(events.initialState)], this.onInitialState,
      [dispatcher.stream(events.reRender)], this.onReRender,
      [dispatcher.stream(events.selectHakemus)], this.onHakemusSelection,
      [dispatcher.stream(events.closeHakemus)], this.onCloseHakemus,
      [dispatcher.stream(events.updateHakemusArvio)], this.onUpdateHakemusArvio,
      [dispatcher.stream(events.updateHakemusStatus)], this.onUpdateHakemusStatus,
      [dispatcher.stream(events.saveHakemusArvio)], this.onSaveHakemusArvio,
      [dispatcher.stream(events.saveCompleted)], this.onSaveCompleted,
      [dispatcher.stream(events.loadComments)], this.onLoadComments,
      [dispatcher.stream(events.commentsLoaded)], this.onCommentsLoaded,
      [dispatcher.stream(events.addComment)], this.onAddComment,
      [dispatcher.stream(events.scoresLoaded)], this.onScoresLoaded,
      [dispatcher.stream(events.setOverriddenAnswerValue)], this.onSetOverriddenAnswerValue,
      [dispatcher.stream(events.changeRequestsLoaded)], this.onChangeRequestsLoaded,
      [dispatcher.stream(events.attachmentVersionsLoaded)], this.onAttachmentVersionsLoaded,
      [dispatcher.stream(events.setScore)], this.onSetScore,
      [dispatcher.stream(events.toggleOthersScoresDisplay)], this.onToggleOthersScoresDisplay,
      [dispatcher.stream(events.togglePersonSelect)], this.onTogglePersonSelect,
      [dispatcher.stream(events.setFilter)], this.onSetFilter,
      [dispatcher.stream(events.setSorter)], this.onSorterSet,
      [dispatcher.stream(events.gotoSavedSearch)], this.onGotoSavedSearch,
      [dispatcher.stream(events.toggleHakemusFilter)], this.onToggleHakemusFilter,
      [dispatcher.stream(events.clearFilters)], this.onClearFilters
    )
  }

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this))
  }

  static commentsUrl(state) {
    return "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + state.selectedHakemus.id + "/comments"
  }

  static scoresUrl(state, hakemusId) {
    return "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + hakemusId + "/scores"
  }

  static changeRequestsUrl(state, hakemusId) {
    return "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + hakemusId + "/change-requests"
  }

  static attachmentVersionsUrl(state, hakemusId) {
    return "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + hakemusId + "/attachments/versions"
  }

  static savedSearchUrl(state) {
    return "/api/avustushaku/" + state.hakuData.avustushaku.id + "/searches"
  }

  onInitialState(emptyState, realInitialState) {
    const query = queryString.parse(location.search)
    if (query.showAll != "true") {
      realInitialState.hakuData.hakemukset = _.filter(realInitialState.hakuData.hakemukset, (hakemus) => {
        return hakemus.status === "submitted" || hakemus.status === "pending_change_request"
      })
    }
    const parsedHakemusIdObject = new RouteParser('/*ignore/hakemus/:hakemus_id/*ignore').match(location.pathname)
    if (parsedHakemusIdObject && parsedHakemusIdObject["hakemus_id"]) {
      this.onHakemusSelection(realInitialState, Number(parsedHakemusIdObject["hakemus_id"]))
    }
    realInitialState.hakuData.form = Immutable(realInitialState.hakuData.form)
    return realInitialState
  }

  onReRender(state) {
    return state
  }

  onBeforeUnload(state) {
    return this.onSaveHakemusArvio(state, state.selectedHakemus)
  }

  onHakemusSelection(state, hakemusIdToSelect) {
    state = this.onSaveHakemusArvio(state, state.selectedHakemus)
    state.selectedHakemus = HakemustenArviointiController.findHakemus(state, hakemusIdToSelect)
    state.previouslySelectedHakemus = undefined
    const pathname = location.pathname
    const parsedUrl = new RouteParser('/avustushaku/:avustushaku_id/(hakemus/:hakemus_id/)*ignore').match(pathname)
    if (!_.isUndefined(history.pushState) && parsedUrl["hakemus_id"] != hakemusIdToSelect.toString()) {
      const newUrl = "/avustushaku/" + parsedUrl["avustushaku_id"] + "/hakemus/" + hakemusIdToSelect + "/" + location.search
      history.pushState({}, window.title, newUrl)
    }
    this.loadScores(state, hakemusIdToSelect)
    this.loadComments()
    this.loadChangeRequests(state, hakemusIdToSelect)
    this.loadAttachmentVersions(state, hakemusIdToSelect)
    if(state.personSelectHakemusId!=null){
      state.personSelectHakemusId=hakemusIdToSelect
    }
    return state
  }

  onCloseHakemus(state) {
    state.previouslySelectedHakemus = state.selectedHakemus
    state.selectedHakemus = undefined
    setTimeout(() => {
      const selected = document.getElementById(`hakemus-${state.previouslySelectedHakemus.id}`)
      window.scrollTo(0, selected.offsetTop)
    }, 300)
    return state
  }

  onToggleHakemusFilter(state){
    state.hakemusFilter.isOpen = !state.hakemusFilter.isOpen
    return state;
  }

  onUpdateHakemusArvio(state, updatedHakemus) {
    state.saveStatus.saveInProgress = true
    updatedHakemus.arvio.hasChanges = true
    if (_.isUndefined(updatedHakemus.arvio.scoring)) {
      delete updatedHakemus.arvio["scoring"];
    }
    this.autoSaveHakemusArvio(updatedHakemus)
    return state
  }

  onSaveHakemusArvio(state, updatedHakemus) {
    const arvio = updatedHakemus ? updatedHakemus.arvio : undefined
    if(arvio && arvio.hasChanges) {
      const updateUrl = "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + updatedHakemus.id + "/arvio"
      HttpUtil.post(updateUrl, _.omit(arvio, "hasChanges"))
          .then(function(response) {
            if(response instanceof Object) {
              const relevantHakemus = HakemustenArviointiController.findHakemus(state, updatedHakemus.id)
              if(relevantHakemus && relevantHakemus.arvio) {
                relevantHakemus.arvio.hasChanges = false
                relevantHakemus.arvio["budget-granted"] = response["budget-granted"]
              }
              dispatcher.push(events.saveCompleted)
            }
            else {
              dispatcher.push(events.saveCompleted, "unexpected-save-error")
            }
          })
          .catch(function(error) {
            console.error(error)
            dispatcher.push(events.saveCompleted, "unexpected-save-error")
          })
    }
    return state
  }

  onUpdateHakemusStatus(state, statusChange) {
    const updateUrl = "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + statusChange.hakemusId + "/status"
    state.saveStatus.saveInProgress = true
    const request = {"status": statusChange.status, "comment": statusChange.comment}
    const self = this
    HttpUtil.post(updateUrl, request)
        .then(function(response) {
          if(response instanceof Object) {
            dispatcher.push(events.saveCompleted)
            self.loadChangeRequests(state, statusChange.hakemusId)
          }
          else {
            dispatcher.push(events.saveCompleted, "unexpected-save-error")
          }
        })
        .catch(function(error) {
          console.error(error)
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
    if (!state.loadingComments && state.selectedHakemus) {
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
      .catch(function(error) {
        console.error(error)
        dispatcher.push(events.saveCompleted, "unexpected-save-error")
      })
    return state
  }

  onSetFilter(state, newFilter) {
    state.hakemusFilter[newFilter.filterId] = newFilter.filter
    if(newFilter.filterId=="evaluator"){
      const avustushakuId = state.hakuData.avustushaku.id
      const evaluatorId = newFilter.filter
      const avustushakuUrl =  `/avustushaku/${avustushakuId}/`
      const url = evaluatorId ? `${avustushakuUrl}?arvioija=${evaluatorId}` : avustushakuUrl
      history.pushState({}, window.title, url)
    }
    return state
  }

  onSorterSet(state, newSorter) {
    state.hakemusSorter = newSorter
    return state
  }

  onGotoSavedSearch(state, hakemusList) {
    const idsToList = _.map(hakemusList, h => { return h.id })
    HttpUtil.put(HakemustenArviointiController.savedSearchUrl(state), { "hakemus-ids": idsToList })
      .then(savedSearchResponse => {
        if (savedSearchResponse instanceof Object) {
          window.localStorage.setItem("va.arviointi.admin.summary.url", savedSearchResponse["search-url"])
        }
        else {
          dispatcher.push(events.saveCompleted, "unexpected-save-error")
        }
      })
      .catch(function(error) {
        console.error('Got error on saved search initialization', error)
        dispatcher.push(events.saveCompleted, "unexpected-save-error")
      })
    return state
  }

  loadScores(state, hakemusId) {
    HttpUtil.get(HakemustenArviointiController.scoresUrl(state, hakemusId)).then(response => {
      dispatcher.push(events.scoresLoaded, {hakemusId: hakemusId,
                                            scoring: response.scoring,
                                            scores: response.scores})
    })
    return state
  }

  loadChangeRequests(state, hakemusId) {
    HttpUtil.get(HakemustenArviointiController.changeRequestsUrl(state, hakemusId)).then(response => {
      dispatcher.push(events.changeRequestsLoaded, {hakemusId: hakemusId,
                                                    changeRequests: response})
    })
    return state
  }

  loadAttachmentVersions(state, hakemusId) {
    HttpUtil.get(HakemustenArviointiController.attachmentVersionsUrl(state, hakemusId)).then(response => {
      dispatcher.push(events.attachmentVersionsLoaded, { hakemusId: hakemusId, attachmentVersions: response})
    })
    return state
  }

  static findHakemus(state, hakemusId) {
    return _.find(state.hakuData.hakemukset, h => { return h.id === hakemusId })
  }

  onScoresLoaded(state, hakemusIdWithScoring) {
    const relevantHakemus = HakemustenArviointiController.findHakemus(state, hakemusIdWithScoring.hakemusId)
    if (relevantHakemus) {
      relevantHakemus.scores = hakemusIdWithScoring.scores
      relevantHakemus.arvio.scoring = hakemusIdWithScoring.scoring
    }
    return state
  }

  onSetOverriddenAnswerValue(state, setOverriddenAnswerValue) {
    const relevantHakemus = HakemustenArviointiController.findHakemus(state, setOverriddenAnswerValue.hakemusId)
    if (relevantHakemus) {
      InputValueStorage.writeValue([setOverriddenAnswerValue.field], relevantHakemus.arvio["overridden-answers"], FieldUpdateHandler.createFieldUpdate(setOverriddenAnswerValue.field, setOverriddenAnswerValue.newValue, VaSyntaxValidator))
      dispatcher.push(events.updateHakemusArvio, relevantHakemus)
    }
    return state
  }

  onChangeRequestsLoaded(state, hakemusIdWithChangeRequests) {
    const relevantHakemus = HakemustenArviointiController.findHakemus(state, hakemusIdWithChangeRequests.hakemusId)
    if (relevantHakemus) {
      relevantHakemus.changeRequests = hakemusIdWithChangeRequests.changeRequests
    }
    return state
  }

  onAttachmentVersionsLoaded(state, hakemusIdWithAttachmentVersions) {
    const relevantHakemus = HakemustenArviointiController.findHakemus(state, hakemusIdWithAttachmentVersions.hakemusId)
    if (relevantHakemus) {
      relevantHakemus.attachmentVersions = hakemusIdWithAttachmentVersions.attachmentVersions
    }
    return state
  }

  onSetScore(state, indexAndScore) {
    const { selectionCriteriaIndex, newScore } = indexAndScore
    const hakemus = state.selectedHakemus;
    const updateUrl = HakemustenArviointiController.scoresUrl(state, hakemus.id)
    state.saveStatus.saveInProgress = true
    HttpUtil.post(updateUrl, { "selection-criteria-index": selectionCriteriaIndex, "score": newScore })
      .then(function(response) {
        if(response instanceof Object) {
          dispatcher.push(events.scoresLoaded, {hakemusId: hakemus.id,
                                                scoring: response.scoring,
                                                scores: response.scores})
          dispatcher.push(events.saveCompleted)
        }
        else {
          dispatcher.push(events.saveCompleted, "unexpected-save-error")
        }
      })
      .catch(function(error) {
        console.error(error)
        dispatcher.push(events.saveCompleted, "unexpected-save-error")
      })
    return state
  }

  onToggleOthersScoresDisplay(state) {
    state.showOthersScores = !state.showOthersScores
    return state
  }

  onTogglePersonSelect(state,hakemusId) {
    state.personSelectHakemusId = hakemusId
    return state
  }

  onClearFilters(state){
    state.hakemusFilter.answers = []
    state.hakemusFilter.evaluator = undefined
    state.hakemusFilter.presenter = undefined
    return state
  }

  // Public API
  selectHakemus(event) {
    const hakemusId = Number(event.currentTarget.id.split('-')[1])
    dispatcher.push(events.selectHakemus, hakemusId)
  }

  closeHakemusDetail() {
    dispatcher.push(events.closeHakemus, {})
  }

  setFilter(filterId, newFilter) {
    dispatcher.push(events.setFilter, {filterId: filterId,
                                       filter: newFilter})
  }

  setSorter(newSorter) {
    dispatcher.push(events.setSorter, newSorter)
  }

  setHakemusArvioStatus(hakemus, newStatus) {
    return function() {
      hakemus.arvio.status = newStatus
      dispatcher.push(events.updateHakemusArvio, hakemus)
    }
  }

  toggleDetailedCosts(hakemus, useDetailedCosts) {
    hakemus.arvio.useDetailedCosts = useDetailedCosts
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  setCostsGrantedValue(hakemus, newValue) {
    hakemus.arvio.costsGranted = newValue
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  setHakemusOverriddenAnswerValue(hakemusId, field, newValue) {
    const setOverriddenAnswerValue = {
      hakemusId: hakemusId,
      field: field,
      newValue: newValue
    }
    dispatcher.push(events.setOverriddenAnswerValue, setOverriddenAnswerValue)
  }

  setChangeRequestText(hakemus, text) {
    return function() {
      hakemus.changeRequest = text
      dispatcher.push(events.reRender)
    }
  }

  setHakemusStatus(hakemus, newStatus, commentGetter) {
    return function() {
      hakemus.status = newStatus
      const statusChange = {
        hakemusId: hakemus.id,
        status: newStatus,
        comment: commentGetter()
      }
      dispatcher.push(events.updateHakemusStatus, statusChange)
    }
  }

  setHakemusRahoitusalue(hakemus, newRahoitusalue) {
    hakemus.arvio["rahoitusalue"] = newRahoitusalue
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  setHakemusArvioBudgetGranted(hakemus, newBudgetGranted) {
    hakemus.arvio["budget-granted"] = newBudgetGranted
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  setHakemusSummaryComment(hakemus, newSummaryComment) {
    hakemus.arvio["summary-comment"] = newSummaryComment
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  setArvioPerustelut(hakemus, perustelut) {
    hakemus.arvio.perustelut = perustelut
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  setPresenterComment(hakemus, value) {
    hakemus.arvio.presentercomment = value
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  loadComments() {
    dispatcher.push(events.loadComments)
  }

  addComment(newComment) {
    dispatcher.push(events.addComment, newComment)
  }

  setScore(selectionCriteriaIndex, newScore) {
    dispatcher.push(events.setScore, { selectionCriteriaIndex: selectionCriteriaIndex, newScore: newScore })
  }

  toggleOthersScoresDisplay() {
    dispatcher.push(events.toggleOthersScoresDisplay)
  }

  gotoSavedSearch(hakemusList) {
    dispatcher.push(events.gotoSavedSearch, hakemusList)
  }

  toggleHakemusFilter() {
    dispatcher.push(events.toggleHakemusFilter)
  }

  togglePersonSelect(hakemusId) {
    dispatcher.push(events.togglePersonSelect,hakemusId)
  }

  toggleHakemusRole(roleId,hakemus,roleField) {
    if(roleField=="presenter"){
        hakemus.arvio["presenter-role-id"]=roleId
    }
    else{
      const currentRoles = hakemus.arvio.roles[roleField]
      hakemus.arvio.roles[roleField] = _.includes(currentRoles, roleId) ? _.without(currentRoles,roleId) : currentRoles.concat(roleId)
    }
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  clearFilters(){
    dispatcher.push(events.clearFilters)
  }

}
