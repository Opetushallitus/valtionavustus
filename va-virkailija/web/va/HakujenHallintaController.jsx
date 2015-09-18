import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

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
  saveCompleted: 'saveCompleted'
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
    this._bind('onUpdateField', 'startAutoSave', 'onSaveCompleted', 'onHakuSelection', 'onHakuSave')

    return Bacon.update(
      {},
      [dispatcher.stream(events.initialState)], this.onInitialState,
      [dispatcher.stream(events.selectHaku)], this.onHakuSelection,
      [dispatcher.stream(events.createHaku)], this.onHakuCreation,
      [dispatcher.stream(events.hakuCreated)], this.onHakuCreated,
      [dispatcher.stream(events.updateField)], this.onUpdateField,
      [dispatcher.stream(events.initAutoSave)], this.onInitAutoSave,
      [dispatcher.stream(events.saveHaku)], this.onHakuSave,
      [dispatcher.stream(events.saveCompleted)], this.onSaveCompleted
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
    return state
  }

  onHakuCreated(state, newHaku) {
    state.hakuList.unshift(newHaku)
    state.selectedHaku = newHaku
    setTimeout(function() {
      document.getElementById("haku-" + newHaku.id).scrollIntoView({block: "start", behavior: "smooth"})
    }, 300)
    return state
  }

  onUpdateField(state, update) {
    switch (update.field.id) {
      case "haku-name-fi": {
        update.avustushaku.content.name.fi = update.newValue
        break;
      }
      case "haku-name-sv": {
        update.avustushaku.content.name.sv = update.newValue
        break;
      }
      default:
        console.error("Unsuported update to field ", update.field.id, ":", update)
    }
    state = this.startAutoSave(state, update.avustushaku)
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
          console.error('Unexpected save error:', response.statusText)
          dispatcher.push(events.saveCompleted, {error: "unexpected-save-error"})
        })
    return state
  }

  onSaveCompleted(state, response) {
    state.saveStatus.saveInProgress = false
    if(response.error) {
      state.saveStatus.serverError = response.error
    }
    else {
      for (var i=0; i < state.hakuList.length; i++) {
        if(state.hakuList[i].id == response.id) {
          state.hakuList[i].status = response.status
          break
        }
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

  createHaku() {
    dispatcher.push(events.createHaku)
  }
}
