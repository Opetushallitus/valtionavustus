import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import queryString from 'query-string'
import RouteParser from 'route-parser'

import Dispatcher from 'soresu-form/web/Dispatcher'
import FormUtil from 'soresu-form/web/form/FormUtil'
import FormStateLoop from 'soresu-form/web/form/FormStateLoop'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import FieldUpdateHandler from 'soresu-form/web/form/FieldUpdateHandler'

import HttpUtil from 'va-common/web/HttpUtil'
import VaSyntaxValidator from 'va-common/web/va/VaSyntaxValidator'
import VaTraineeDayUtil from 'va-common/web/va/VaTraineeDayUtil'

import HakemusArviointiStatuses from './hakemus-details/HakemusArviointiStatuses'
import HakemusSelvitysStatuses from './hakemus-details/HakemusSelvitysStatuses'
import RahoitusalueSelections from './hakemus-details/RahoitusalueSelections'

const dispatcher = new Dispatcher()

const events = {
  beforeUnload: 'beforeUnload',
  initialState: 'initialState',
  reRender: 'reRender',
  refreshAttachments: 'refreshAttachments',
  refreshHakemukset: 'refreshHakemukset',
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
  loadSelvitys: 'loadSelvitys',
  selvitysLoaded: 'selvitysLoaded',
  addComment: 'addComment',
  scoresLoaded: 'scoresLoaded',
  setOverriddenAnswerValue: 'setOverriddenAnswerValue',
  setSeurantaAnswerValue: 'setSeurantaAnswerValue',
  changeRequestsLoaded: 'changeRequestsLoaded',
  attachmentVersionsLoaded: 'attachmentVersionsLoaded',
  setScore: 'setScore',
  toggleOthersScoresDisplay: 'toggleOthersScoresDisplay',
  gotoSavedSearch: 'gotoSavedSearch',
  toggleHakemusFilter:'toggleHakemusFilter',
  togglePersonSelect:'togglePersonSelect',
  clearFilters:'clearFilters',
  selectEditorSubTab: 'selectEditorSubTab'
}

export default class HakemustenArviointiController {

  initializeState(avustushakuId,evaluator) {
    this._bind('onInitialState', 'onHakemusSelection', 'onUpdateHakemusStatus', 'onUpdateHakemusArvio', 'onSaveHakemusArvio', 'onBeforeUnload','onRefreshHakemukset')
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
        status_valiselvitys: HakemusSelvitysStatuses.allStatuses(),
        status_loppuselvitys: HakemusSelvitysStatuses.allStatuses(),
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
      selectedHakemusAccessControl: {},
      showOthersScores: false,
      saveStatus: {
        saveInProgress: false,
        saveTime: null,
        serverError: ""
      },
      translations: Bacon.fromPromise(HttpUtil.get("/translations.json")).map(Immutable),
      userInfo: Bacon.fromPromise(HttpUtil.get("/api/userinfo")),
      subTab: 'arviointi'
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
      [dispatcher.stream(events.refreshAttachments)], this.onRefreshAttachments,
      [dispatcher.stream(events.refreshHakemukset)], this.onRefreshHakemukset,
      [dispatcher.stream(events.selectHakemus)], this.onHakemusSelection,
      [dispatcher.stream(events.closeHakemus)], this.onCloseHakemus,
      [dispatcher.stream(events.updateHakemusArvio)], this.onUpdateHakemusArvio,
      [dispatcher.stream(events.updateHakemusStatus)], this.onUpdateHakemusStatus,
      [dispatcher.stream(events.saveHakemusArvio)], this.onSaveHakemusArvio,
      [dispatcher.stream(events.saveCompleted)], this.onSaveCompleted,
      [dispatcher.stream(events.loadComments)], this.onLoadComments,
      [dispatcher.stream(events.commentsLoaded)], this.onCommentsLoaded,
      [dispatcher.stream(events.loadSelvitys)], this.onLoadSelvitys,
      [dispatcher.stream(events.selvitysLoaded)], this.onSelvitysLoaded,
      [dispatcher.stream(events.addComment)], this.onAddComment,
      [dispatcher.stream(events.scoresLoaded)], this.onScoresLoaded,
      [dispatcher.stream(events.setOverriddenAnswerValue)], this.onSetOverriddenAnswerValue,
      [dispatcher.stream(events.setSeurantaAnswerValue)], this.onSetSeurantaAnswerValue,
      [dispatcher.stream(events.changeRequestsLoaded)], this.onChangeRequestsLoaded,
      [dispatcher.stream(events.attachmentVersionsLoaded)], this.onAttachmentVersionsLoaded,
      [dispatcher.stream(events.setScore)], this.onSetScore,
      [dispatcher.stream(events.toggleOthersScoresDisplay)], this.onToggleOthersScoresDisplay,
      [dispatcher.stream(events.togglePersonSelect)], this.onTogglePersonSelect,
      [dispatcher.stream(events.setFilter)], this.onSetFilter,
      [dispatcher.stream(events.setSorter)], this.onSorterSet,
      [dispatcher.stream(events.gotoSavedSearch)], this.onGotoSavedSearch,
      [dispatcher.stream(events.toggleHakemusFilter)], this.onToggleHakemusFilter,
      [dispatcher.stream(events.clearFilters)], this.onClearFilters,
      [dispatcher.stream(events.selectEditorSubTab)], this.onSelectEditorSubTab
    )
  }

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this))
  }

  static commentsUrl(state) {
    return "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + state.selectedHakemus.id + "/comments"
  }

  static selvitysUrl(state) {
    return "/api/avustushaku/" + state.hakuData.avustushaku.id + "/hakemus/" + state.selectedHakemus.id + "/selvitys"
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

  static filterHakemukset(hakemukset){
    return _.filter(hakemukset, (hakemus) => {
      const status = hakemus.status
      return status === "submitted" || status === "pending_change_request" || status === "officer_edit"
    })
  }

  onInitialState(emptyState, realInitialState) {
    const query = queryString.parse(location.search)
    if (query.showAll != "true") {
      realInitialState.hakuData.hakemukset = HakemustenArviointiController.filterHakemukset(realInitialState.hakuData.hakemukset)
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
    const pathname = location.pathname
    const parsedUrl = new RouteParser('/avustushaku/:avustushaku_id/(hakemus/:hakemus_id/:subTab/)*ignore').match(pathname)
    const subTab = parsedUrl.subTab || 'arviointi'
    state.subTab = subTab
    if (!_.isUndefined(history.pushState) && parsedUrl.hakemus_id != hakemusIdToSelect.toString()) {
      const newUrl = "/avustushaku/" + parsedUrl.avustushaku_id + "/hakemus/" + hakemusIdToSelect + "/" + subTab + "/" + location.search
      history.pushState({}, window.title, newUrl)
    }
    this.setSelectedHakemusAccessControl(state)
    this.setDefaultBudgetValuesForSelectedHakemusOverriddenAnswers(state)
    this.setDefaultBudgetValuesForSelectedHakemusSeurantaAnswers(state)
    this.setDefaultTraineeDayValuesForSelectedHakemusOverriddenAnswers(state)
    this.validateHakemusRahoitusalueAndTalousarviotiliSelection(state)
    this.loadScores(state, hakemusIdToSelect)
    this.loadComments()
    this.loadSelvitys()
    this.loadChangeRequests(state, hakemusIdToSelect)
    this.loadAttachmentVersions(state, hakemusIdToSelect)
    if(state.personSelectHakemusId!=null){
      state.personSelectHakemusId=hakemusIdToSelect
    }
    return state
  }

  setSelectedHakemusAccessControl(state) {
    const avustushaku = state.hakuData.avustushaku
    const privileges = state.hakuData.privileges

    const hakuIsPublishedAndEnded = avustushaku.status === "published" && avustushaku.phase === "ended"

    state.selectedHakemusAccessControl = {
      allowHakemusCommenting:   hakuIsPublishedAndEnded,
      allowHakemusStateChanges: hakuIsPublishedAndEnded && privileges["change-hakemus-state"],
      allowHakemusScoring:      hakuIsPublishedAndEnded && privileges["score-hakemus"],
      allowEditStateChanges:    privileges["change-hakemus-state"]
    }
  }

  onCloseHakemus(state) {
    if (state.selectedHakemus) {
      const previouslySelectedHakemusId = state.selectedHakemus.id
      setTimeout(() => {
        const selected = document.getElementById(`hakemus-${previouslySelectedHakemusId}`)
        if (selected) {
          window.scrollTo(0, selected.offsetTop)
        }
      }, 300)
    }
    state.selectedHakemus = undefined
    return state
  }

  selectEditorSubtab(subTabToSelect) {
    dispatcher.push(events.selectEditorSubTab, subTabToSelect)
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

  loadSelvitys(){
    dispatcher.push(events.loadSelvitys)
  }

  onLoadSelvitys(state) {
    if (!state.loadingSelvitys && state.selectedHakemus) {
      state.loadingSelvitys = true
      HttpUtil.get(HakemustenArviointiController.selvitysUrl(state)).then(selvitys => {
        dispatcher.push(events.selvitysLoaded, selvitys)
      })
    }
    return state
  }

  onSelvitysLoaded(state, selvitys) {
    if (state.selectedHakemus) {
      state.selectedHakemus.selvitys = selvitys
      state.selectedHakemus.selvitys.loppuselvitysForm = Immutable(state.selectedHakemus.selvitys.loppuselvitysForm)
      state.selectedHakemus.selvitys.valiselvitysForm = Immutable(state.selectedHakemus.selvitys.valiselvitysForm)
    }
    state.loadingSelvitys = false
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

  saveError(){
    dispatcher.push(events.saveCompleted, "unexpected-save-error")
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

  static doOnAnswerValue(state,value,field){
    const relevantHakemus = HakemustenArviointiController.findHakemus(state, value.hakemusId)
    if (relevantHakemus) {
      InputValueStorage.writeValue([value.field], relevantHakemus.arvio[field], FieldUpdateHandler.createFieldUpdate(value.field, value.newValue, VaSyntaxValidator))
      dispatcher.push(events.updateHakemusArvio, relevantHakemus)
    }
    return state
  }

  onSetOverriddenAnswerValue(state, value) {
    return HakemustenArviointiController.doOnAnswerValue(state, value, "overridden-answers" )
  }

  onSetSeurantaAnswerValue(state, value) {
    return HakemustenArviointiController.doOnAnswerValue(state, value, "seuranta-answers" )
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

  setDefaultBudgetValuesForSelectedHakemusOverriddenAnswers(state) {
    if (!state.selectedHakemusAccessControl.allowHakemusStateChanges) {
      return
    }

    const budgetElement = FormUtil.findFieldByFieldType(state.hakuData.form.content, "vaBudget")

    if (!budgetElement) {
      return
    }

    const selectedHakemus = state.selectedHakemus
    const hakemusAnswers = selectedHakemus.answers
    const overriddenAnswers = selectedHakemus.arvio["overridden-answers"]

    const findSelfFinancingSpecField = () => {
      const budgetSummaryElement = _.find(budgetElement.children, n => n.fieldType === "vaBudgetSummaryElement")
      return FormUtil.findFieldByFieldType(budgetSummaryElement, "vaSelfFinancingField")
    }

    const writeChangedAnswerFieldValues = fields => {
      let didWrite = false

      _.forEach(fields, field => {
        const oldValue = InputValueStorage.readValue(null, overriddenAnswers, field.id)
        const newValue = InputValueStorage.readValue(null, hakemusAnswers, field.id)

        if (newValue !== oldValue && newValue !== "") {
          InputValueStorage.writeValue(
            budgetElement,
            overriddenAnswers,
            {
              id: field.id,
              field: field,
              value: newValue
            })

          didWrite = true
        }
      })

      return didWrite
    }

    // gather empty values for descriptions and answer fields for cost budget items
    const {emptyDescriptions, answerCostFieldsToCopy} = _.reduce(FormUtil.findFieldsByFieldType(budgetElement, "vaBudgetItemElement"), (acc, budgetItem) => {
      const descriptionField = budgetItem.children[0]
      acc.emptyDescriptions[descriptionField.id] = ''
      if (!budgetItem.params.incrementsTotal) {
        const valueField = budgetItem.children[1]
        acc.answerCostFieldsToCopy.push(valueField)
      }
      return acc
    }, {emptyDescriptions: {}, answerCostFieldsToCopy: []})

    FormStateLoop.initDefaultValues(
      overriddenAnswers,
      emptyDescriptions,
      budgetElement,
      null
    )

    const selfFinancingFieldToCopy = findSelfFinancingSpecField()

    const answerFieldsToCopy = selfFinancingFieldToCopy ? answerCostFieldsToCopy.concat(selfFinancingFieldToCopy) : answerCostFieldsToCopy

    const didUpdateAnswerFields = writeChangedAnswerFieldValues(answerFieldsToCopy)

    if (didUpdateAnswerFields) {
      dispatcher.push(events.updateHakemusArvio, selectedHakemus)
    }
  }

  setDefaultBudgetValuesForSelectedHakemusSeurantaAnswers(state) {
    const budgetElement = FormUtil.findFieldByFieldType(state.hakuData.form.content, "vaBudget")

    if (!budgetElement) {
      return
    }

    const selectedHakemus = state.selectedHakemus
    const hakemusAnswers = selectedHakemus.answers
    const defaultValues = _.reduce(FormUtil.findFieldsByFieldType(budgetElement, "vaBudgetItemElement"), (acc, budgetItem) => {
      const descriptionField = budgetItem.children[0]
      acc[descriptionField.id] = ''
      if (!budgetItem.params.incrementsTotal) {
        const valueField = budgetItem.children[1]
        acc[valueField.id] = InputValueStorage.readValue(null, hakemusAnswers, valueField.id)
      }
      return acc
    }, {})

    FormStateLoop.initDefaultValues(
      selectedHakemus.arvio["seuranta-answers"],
      defaultValues,
      budgetElement,
      null
    )
  }

  setDefaultTraineeDayValuesForSelectedHakemusOverriddenAnswers(state) {
    if (!state.selectedHakemusAccessControl.allowHakemusStateChanges) {
      return
    }

    const selectedHakemus = state.selectedHakemus
    const hakemusAnswers = selectedHakemus.answers
    const overriddenAnswers = selectedHakemus.arvio["overridden-answers"]

    const defaultFields = _.reduce(
      VaTraineeDayUtil.collectCalculatorSpecifications(state.hakuData.form.content, hakemusAnswers),
      (acc, field) => {
        acc[field.id] = _.assign(
          {},
          field,
          {value: _.cloneDeep(InputValueStorage.readValue(null, hakemusAnswers, field.id))}
        )
        return acc
      },
      {})

    const addNewAndUpdateOutdatedOverriddenAnswers = () => {
      let didUpdate = false

      _.forEach(defaultFields, (defaultField, id) => {
        const oldValue = InputValueStorage.readValue(null, overriddenAnswers, id)

        if (oldValue === "") {
          // overridden answer does not exist, copy it as is from hakemus answers
          InputValueStorage.writeValue({}, overriddenAnswers, {
            id: id,
            field: defaultField,
            value: defaultField.value
          })
          didUpdate = true
        } else {
          // overridden answer exists
          const oldScopeTypeSubfield = VaTraineeDayUtil.findSubfieldById(oldValue, id, "scope-type")
          const newScopeTypeSubfield = VaTraineeDayUtil.findSubfieldById(defaultField.value, id, "scope-type")

          if (oldScopeTypeSubfield && newScopeTypeSubfield && oldScopeTypeSubfield.value !== newScopeTypeSubfield.value) {
            // scope type for the overridden answer has changed compared to hakemus answer, update scope type and total accordingly
            const oldScopeSubfield = VaTraineeDayUtil.findSubfieldById(oldValue, id, "scope")
            const oldPersonCountSubfield = VaTraineeDayUtil.findSubfieldById(oldValue, id, "person-count")
            const oldTotalSubfield = VaTraineeDayUtil.findSubfieldById(oldValue, id, "total")

            const newTotal = VaTraineeDayUtil.composeTotal(oldScopeSubfield.value, oldPersonCountSubfield.value, newScopeTypeSubfield.value)

            const newValue = [
              _.assign({}, oldPersonCountSubfield),
              _.assign({}, oldScopeSubfield),
              _.assign({}, oldScopeTypeSubfield, {value: newScopeTypeSubfield.value}),
              _.assign({}, oldTotalSubfield, {value: newTotal})
            ]

            InputValueStorage.writeValue({}, overriddenAnswers, {
              id: id,
              field: defaultField,
              value: newValue
            })

            didUpdate = true
          }
        }
      })

      return didUpdate
    }

    const deleteStaleOverriddenAnswers = () => {
      const overriddenAnswerIds = _.chain(overriddenAnswers.value)
        .filter(ans => ans.fieldType === "vaTraineeDayCalculator")
        .pluck('key')
        .value()

      const answerIdsToPreserve = _.keys(defaultFields)

      const overriddenAnswerIdsToDelete = _.difference(overriddenAnswerIds, answerIdsToPreserve)

      if (_.isEmpty(overriddenAnswerIdsToDelete)) {
        return false
      }

      overriddenAnswers.value = _.filter(overriddenAnswers.value, ans => !_.includes(overriddenAnswerIdsToDelete, ans.key))

      return true
    }

    let didUpdateOverriddenAnswers = false

    if (addNewAndUpdateOutdatedOverriddenAnswers()) {
      didUpdateOverriddenAnswers = true
    }

    if (deleteStaleOverriddenAnswers()) {
      didUpdateOverriddenAnswers = true
    }

    if (didUpdateOverriddenAnswers) {
      dispatcher.push(events.updateHakemusArvio, selectedHakemus)
    }
  }

  validateHakemusRahoitusalueAndTalousarviotiliSelection(state) {
    if (!state.selectedHakemusAccessControl.allowHakemusStateChanges) {
      return
    }

    const avustushaku = state.hakuData.avustushaku
    const availableRahoitusalueet = avustushaku.content.rahoitusalueet
    const hakemusArvio = state.selectedHakemus.arvio

    const selectedRahoitusalue = RahoitusalueSelections.validateRahoitusalueSelection(
      hakemusArvio.rahoitusalue,
      availableRahoitusalueet)

    const selectedTalousarviotili = RahoitusalueSelections.validateTalousarviotiliSelection({
      selectedTalousarviotili: hakemusArvio.talousarviotili,
      selectedRahoitusalue,
      availableRahoitusalueet
    })

    if (hakemusArvio.rahoitusalue !== selectedRahoitusalue || hakemusArvio.talousarviotili !== selectedTalousarviotili) {
      this.setHakemusRahoitusalueAndTalousarviotili({
        hakemus:         state.selectedHakemus,
        rahoitusalue:    selectedRahoitusalue,
        talousarviotili: selectedTalousarviotili
      })
    }
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

  static setAnswerValue(hakemusId, field, newValue, event){
    const setOverriddenAnswerValue = {
      hakemusId: hakemusId,
      field: field,
      newValue: newValue
    }
    dispatcher.push(event, setOverriddenAnswerValue)
  }

  setHakemusOverriddenAnswerValue(hakemusId, field, newValue) {
    HakemustenArviointiController.setAnswerValue(hakemusId, field, newValue, events.setOverriddenAnswerValue)
  }

  setHakemusSeurantaAnswerValue(hakemusId, field, newValue) {
    HakemustenArviointiController.setAnswerValue(hakemusId, field, newValue, events.setSeurantaAnswerValue)
  }



  setChangeRequestText(hakemus, text) {
    return function() {
      hakemus.changeRequest = text
      dispatcher.push(events.reRender)
    }
  }

  refreshAttachments(avustushakuId){
    const s = Bacon.fromPromise(HttpUtil.get("/api/avustushaku/" + avustushakuId))
    s.onValue((hakuData)=>
      dispatcher.push(events.refreshAttachments,hakuData)
    )
  }

  refreshHakemukset(avustushakuId){
    const s = Bacon.fromPromise(HttpUtil.get("/api/avustushaku/" + avustushakuId))
    s.onValue((hakuData)=>
      dispatcher.push(events.refreshHakemukset,hakuData)
    )
  }

  onRefreshAttachments(state,hakuData){
    state.hakuData.attachments = hakuData.attachments
    return state

  }

  onRefreshHakemukset(state,hakuData){
    state.hakuData.hakemukset = HakemustenArviointiController.filterHakemukset(hakuData.hakemukset)
    if(state.selectedHakemus){
      this.onHakemusSelection(state,state.selectedHakemus.id)
    }
    return state

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

  setHakemusRahoitusalueAndTalousarviotili({hakemus, rahoitusalue, talousarviotili}) {
    hakemus.arvio.rahoitusalue = rahoitusalue
    hakemus.arvio.talousarviotili = talousarviotili
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  setOppilaitos(hakemus, index, oppilaitos) {
    if(!hakemus.arvio["oppilaitokset"]) {
      hakemus.arvio["oppilaitokset"] = {names: []}
    }
    if(index + 1 > hakemus.arvio["oppilaitokset"].names.length) {
      hakemus.arvio["oppilaitokset"].names.push(oppilaitos)
    } else {
      hakemus.arvio["oppilaitokset"].names[index] = oppilaitos
    }
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  removeOppilaitos(hakemus, index) {
    if(hakemus.arvio["oppilaitokset"] && index >= 0 && index < hakemus.arvio["oppilaitokset"].names.length) {
      hakemus.arvio["oppilaitokset"].names.splice(index, 1);
      dispatcher.push(events.updateHakemusArvio, hakemus)
    }
  }

  setHakemusAcademysize(hakemus, size) {
    hakemus.arvio.academysize = size
    dispatcher.push(events.updateHakemusArvio, hakemus)
  }

  setTags(hakemus, tags) {
    hakemus.arvio.tags = {value:tags}
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

  onSelectEditorSubTab(state, subTabToSelect) {
    state.subTab = subTabToSelect
    if (!_.isUndefined(history.pushState)) {
      const haku = state.hakuData.avustushaku.id
      const hakemusId = state.selectedHakemus.id
      const newUrl = `/avustushaku/${haku}/hakemus/${hakemusId}/${subTabToSelect}/${location.search}`
      history.pushState({}, window.title, newUrl)
    }
    return state
  }
}
