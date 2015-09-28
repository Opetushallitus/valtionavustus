import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'
import moment from 'moment-timezone'

import HttpUtil from 'va-common/web/HttpUtil.js'
import Dispatcher from 'va-common/web/Dispatcher'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState',
  selectHaku: 'selectHaku',
  createHaku: 'createHaku',
  hakuCreated: 'hakuCreated',
  initAutoSave: 'initAutoSave',
  updateField: 'updateField',
  saveHaku: 'saveHaku',
  saveCompleted: 'saveCompleted',
  addSelectionCriteria: 'addSelectionCriteria',
  deleteSelectionCriteria: 'deleteSelectionCriteria'
}

export default class HakujenHallintaController {

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this))
  }

  initializeState() {
    const initialStateTemplate = {
      hakuList: Bacon.fromPromise(HttpUtil.get("/api/avustushaku")),
      userInfo: Bacon.fromPromise(HttpUtil.get("/api/userinfo")),
      environment: Bacon.fromPromise(HttpUtil.get("/environment")),
      selectedHaku: undefined,
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
    this.autoSave = _.debounce(function(){ dispatcher.push(events.saveHaku) }, 3000)
    this._bind('onUpdateField', 'onHakuCreated', 'startAutoSave', 'onSaveCompleted', 'onHakuSelection', 'onHakuSave', 'onAddSelectionCriteria', 'onDeleteSelectionCriteria')

    return Bacon.update(
      {},
      [dispatcher.stream(events.initialState)], this.onInitialState,
      [dispatcher.stream(events.selectHaku)], this.onHakuSelection,
      [dispatcher.stream(events.createHaku)], this.onHakuCreation,
      [dispatcher.stream(events.hakuCreated)], this.onHakuCreated,
      [dispatcher.stream(events.updateField)], this.onUpdateField,
      [dispatcher.stream(events.initAutoSave)], this.onInitAutoSave,
      [dispatcher.stream(events.saveHaku)], this.onHakuSave,
      [dispatcher.stream(events.saveCompleted)], this.onSaveCompleted,
      [dispatcher.stream(events.addSelectionCriteria)], this.onAddSelectionCriteria,
      [dispatcher.stream(events.deleteSelectionCriteria)], this.onDeleteSelectionCriteria
    )
  }

  onInitialState(emptyState, realInitialState) {
    var hakuList = realInitialState.hakuList;
    if (hakuList && !_.isEmpty(hakuList)) {
      realInitialState.selectedHaku = hakuList[0]
    }
    return realInitialState
  }

  onHakuCreation(state) {
    HttpUtil.put("/api/avustushaku", {})
      .then(function(response) {
        console.log("Created new haku. Response=", JSON.stringify(response))
        dispatcher.push(events.hakuCreated, response)
      })
      .catch(function(response) {
        console.error('Unexpected create error:', response.statusText)
        dispatcher.push(events.saveCompleted, {error: "unexpected-create-error"})
      })
    return state
  }

  onHakuCreated(state, newHaku) {
    state.hakuList.unshift(newHaku)
    state = this.onHakuSelection(state, newHaku)
    setTimeout(function() {
      document.getElementById("haku-" + newHaku.id).scrollIntoView({block: "start", behavior: "smooth"})
      document.getElementById("haku-name-fi").focus()
    }, 300)
    return state
  }

  onUpdateField(state, update) {
    const hakuname = /haku-name-(\w+)/.exec(update.field.id)
    const hakuaika = /hakuaika-(\w+)/.exec(update.field.id)
    const status = /set-status-(\w+)/.exec(update.field.id)
    const financingProcentage = /haku-self-financing-percentage/.exec(update.field.id)
    const selectionCriteria = /selection-criteria-(\d+)-(\w+)/.exec(update.field.id)
    var doSave = true
    if(hakuname) {
      const lang = hakuname[1]
      update.avustushaku.content.name[lang] = update.newValue
    }
    else if(hakuaika) {
      const startOrEnd = hakuaika[1]
      const newDate = moment(update.newValue, "DD.MM.YYYY HH.mm")
      if(newDate.isSame(update.avustushaku.content.duration[startOrEnd])) {
        doSave = false
      }
      else {
        update.avustushaku.content.duration[startOrEnd] = newDate.toDate()
      }
    }
    else if(financingProcentage) {
      update.avustushaku.content["self-financing-percentage"] = parseInt(update.newValue)
    }
    else if(status) {
      update.avustushaku.status = update.newValue
    }
    else if(selectionCriteria) {
      const index = selectionCriteria[1]
      const lang = selectionCriteria[2]
      update.avustushaku.content['selection-criteria'].items[index][lang] = update.newValue
    }
    else {
      console.error("Unsuported update to field ", update.field.id, ":", update)
      doSave = false
    }
    if(doSave) {
      state = this.startAutoSave(state, update.avustushaku)
    }
    return state
  }

  onAddSelectionCriteria(state, avustushaku) {
    avustushaku.content['selection-criteria'].items.push({fi:"", sv:""})
    setTimeout(function() {
      document.getElementById("selection-criteria-" + (avustushaku.content['selection-criteria'].items.length -1) + "-fi").focus()
    }, 300)
    state = this.startAutoSave(state, avustushaku)
    return state
  }

  onDeleteSelectionCriteria(state, deletion) {
    deletion.avustushaku.content['selection-criteria'].items.splice(deletion.index, 1)
    state = this.startAutoSave(state, deletion.avustushaku)
    return state
  }

  startAutoSave(state) {
    state.saveStatus.saveInProgress = true
    this.autoSave()
    return state
  }

  onHakuSave(state) {
    HttpUtil.post("/api/avustushaku/" + state.selectedHaku.id, state.selectedHaku)
        .then(function(response) {
          console.log("Saved haku. Response=", JSON.stringify(response))
          dispatcher.push(events.saveCompleted, response)
        })
        .catch(function(response) {
          if(response.status === 400) {
            dispatcher.push(events.saveCompleted, {error: "validation-error"})
          }
          else {
            console.error('Unexpected save error:', response.statusText)
            dispatcher.push(events.saveCompleted, {error: "unexpected-save-error"})
          }
        })
    return state
  }

  onSaveCompleted(state, response) {
    state.saveStatus.saveInProgress = false
    if(response.error) {
      state.saveStatus.serverError = response.error
    }
    else {
      const oldHaku = _.find(state.hakuList, haku => haku.id ===  response.id)
      if(oldHaku) { 
        oldHaku.status = response.status
      }
      state.saveStatus.saveTime = new Date()
      state.saveStatus.serverError = ""
    }
    return state
  }

  onHakuSelection(state, hakuToSelect) {
    if(state.saveStatus.saveInProgress) {
      this.autoSave.cancel()
      state = this.onHakuSave(state)
    }
    state.selectedHaku = hakuToSelect
    return state
  }

  // Public API
  selectHaku(hakemus) {
    return function() {
      dispatcher.push(events.selectHaku, hakemus)
    }
  }

  onChangeListener(avustushaku, field, newValue) {
    dispatcher.push(events.updateField, {avustushaku: avustushaku, field: field, newValue: newValue})
  }

  addSelectionCriteria(avustushaku) {
    return function() {
      dispatcher.push(events.addSelectionCriteria, avustushaku)
    }
  }

  deleteSelectionCriteria(avustushaku, index) {
    return function() {
      dispatcher.push(events.deleteSelectionCriteria, {avustushaku: avustushaku, index: index})
    }
  }

  createHaku() {
    dispatcher.push(events.createHaku)
  }
}
