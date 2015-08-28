import _ from 'lodash'
import Immutable from 'seamless-immutable'

import LocalStorage from './LocalStorage.js'
import InputValueStorage from './InputValueStorage.js'
import HttpUtil from './HttpUtil.js'
import FormUtil from './FormUtil.js'
import FormRules from './FormRules.js'
import FormBranchGrower from './FormBranchGrower.js'
import FieldUpdateHandler from './FieldUpdateHandler.js'

const serverOperations = {
  initialSave: 'initialSave',
  autoSave: 'autoSave',
  submit: 'submit'
}

export default class FormStateTransitions {
  constructor(dispatcher, events, develQueryParam) {
    this.dispatcher = dispatcher
    this.events = events
    this.autoSave = _.debounce(function(){ dispatcher.push(events.save) }, develQueryParam? 100 : 3000)
    this.pollServerAnswers = _.debounce(function(){ dispatcher.push(events.pollServerAnswers) },  develQueryParam? 500 : 5000)
    this._bind(
      'startAutoSave', 'onInitialState', 'onUpdateField', 'onFieldValidation', 'onChangeLang', 'updateOld', 'onSave',
      'onBeforeUnload', 'onInitAutoSave', 'onSaveCompleted', 'onSubmit', 'onRemoveField', 'onServerError')
  }

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this))
  }

  startAutoSave(state) {
    const formOperations = state.extensionApi.formOperations
    if (formOperations.isSaveDraftAllowed(state)) {
      state.saveStatus.saveInProgress = true
      this.autoSave()
    }
    return state
  }

  onInitialState(state, realInitialState) {
    const onInitialStateLoaded = realInitialState.extensionApi.onInitialStateLoaded
    FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(realInitialState.form.content, realInitialState.saveStatus.values)
    if (_.isFunction(onInitialStateLoaded)) {
      onInitialStateLoaded(realInitialState)
    }
    this.pollServerAnswers()
    return realInitialState
  }

  onUpdateField(state, fieldUpdate) {
    const formOperations = state.extensionApi.formOperations
    FieldUpdateHandler.updateStateFromFieldUpdate(state, fieldUpdate)
    FormRules.applyRulesToForm(state.form.specification, state.form.content, state.saveStatus.values)
    if (_.isFunction(formOperations.onFieldUpdate)) {
      formOperations.onFieldUpdate(state, fieldUpdate.field, fieldUpdate.value)
    }
    FieldUpdateHandler.triggerRelatedFieldValidationIfNeeded(state, fieldUpdate)
    const clientSideValidationPassed = state.form.validationErrors[fieldUpdate.id].length === 0
    if (clientSideValidationPassed) {
      FormBranchGrower.expandGrowingFieldSetIfNeeded(state, fieldUpdate);
      if (_.isFunction(formOperations.onFieldValid)) {
        formOperations.onFieldValid(state, fieldUpdate.field, fieldUpdate.value)
      }
    }
    state.saveStatus.changes = true
    LocalStorage.save(formOperations.createUiStateIdentifier, state, fieldUpdate)
    this.startAutoSave(state)
    return state
  }

  onFieldValidation(state, validation) {
    if (validation.showErrorsAlways || state.extensionApi.formOperations.isNotFirstEdit(state)) {
      state.form.validationErrors = state.form.validationErrors.merge({[validation.id]: validation.validationErrors})
    }
    return state
  }

  onChangeLang(state, lang) {
    state.configuration.lang = lang
    return state
  }

  static handleUnexpectedServerError(dispatcher, events, method, url, error, serverOperation) {
    console.error('Unexpected', serverOperation, 'error', error, 'in', method, 'to', url)
    if (serverOperation === serverOperations.submit) {
      dispatcher.push(events.serverError, {error: "unexpected-submit-error"})
    } else if (serverOperation === serverOperations.initialSave) {
      dispatcher.push(events.serverError, {error: "unexpected-save-error"})
    } else if (serverOperation === serverOperations.autoSave) {
      dispatcher.push(events.initAutoSave)
    }
  }

  static handleServerError(dispatcher, events, status, error, method, url, response, serverOperation) {
    console.warn('Handle', serverOperation, 'error', error, 'in', method, 'to', url, 'with status', status, 'and response', JSON.stringify(response))
    if (status === 400) {
      dispatcher.push(events.serverError, {error: "submit-validation-errors", validationErrors: response})
    }
    else if (status === 409) {
      // TODO: Resolve updates from server.
      // At the moment just tell that something has changes
      dispatcher.push(events.serverError, {error: "conflict-save-error"})
    }
    else{
      FormStateTransitions.handleUnexpectedServerError(dispatcher, events, method, url, error, serverOperation)
    }
  }

  updateOld(state, serverOperation, onSuccessCallback) {
    const formOperations = state.extensionApi.formOperations
    const url = formOperations.urlCreator.editEntityApiUrl(state)+ (serverOperation === serverOperations.submit ? "/submit" : "")
    const dispatcher = this.dispatcher
    const events = this.events
    try {
      state.saveStatus.saveInProgress = true
      HttpUtil.post(url, state.saveStatus.values)
        .then(function(response) {
          console.log("Saved to server (", serverOperation, "). Response=", JSON.stringify(response))
          const updatedState = _.cloneDeep(state)
          updatedState.saveStatus.savedObject = response
          updatedState.saveStatus.values = formOperations.responseParser.getFormAnswers(response)
          updatedState.form.validationErrors = Immutable(updatedState.form.validationErrors)
          if (onSuccessCallback) {
            onSuccessCallback(updatedState)
          }
          dispatcher.push(events.saveCompleted, updatedState)
        })
        .catch(function(response) {
            FormStateTransitions.handleServerError(dispatcher, events, response.status, response.statusText, "POST", url, response.data, serverOperation)
        })
    }
    catch(error) {
      FormStateTransitions.handleUnexpectedServerError(dispatcher, events, "POST", url, error, serverOperation);
    }
    finally {
      return state
    }
  }

  onSave(state, params) {
    const onSuccessCallback = params ? params.onSuccessCallback : undefined
    const formOperations = state.extensionApi.formOperations
    if (formOperations.isSaveDraftAllowed(state) && state.saveStatus.changes) {
      return this.updateOld(state, serverOperations.autoSave, onSuccessCallback)
    }
    return state
  }

  onBeforeUnload(state) {
    const formOperations = state.extensionApi.formOperations
    if (formOperations.isSaveDraftAllowed(state) && state.saveStatus.changes) {
      return this.updateOld(state, serverOperations.autoSave)
    }
  }

  onInitAutoSave(state) {
    this.startAutoSave(state)
    return state
  }

  onSaveCompleted(stateFromUiLoop, stateWithServerChanges) {
    const formOperations = stateFromUiLoop.extensionApi.formOperations
    var locallyStoredValues = LocalStorage.load(formOperations.createUiStateIdentifier, stateWithServerChanges)
    stateFromUiLoop.saveStatus.changes = !_.isEqual(stateFromUiLoop.saveStatus.values, stateWithServerChanges.saveStatus.values)
    stateFromUiLoop.saveStatus.saveInProgress = false
    stateFromUiLoop.saveStatus.saveTime = new Date()
    stateFromUiLoop.saveStatus.serverError = ""
    stateFromUiLoop.saveStatus.savedObject = stateWithServerChanges.saveStatus.savedObject
    if (!locallyStoredValues) {
      stateFromUiLoop.saveStatus.values = stateWithServerChanges.saveStatus.values
      stateFromUiLoop.form.validationErrors = stateWithServerChanges.form.validationErrors
      LocalStorage.save(formOperations.createUiStateIdentifier, stateFromUiLoop)
    }
    if (_.isFunction(formOperations.onSaveCompletedCallback)) {
      formOperations.onSaveCompletedCallback(stateFromUiLoop, stateWithServerChanges)
    }
    if (stateFromUiLoop.saveStatus.changes) {
      this.startAutoSave(stateFromUiLoop)
    }
    return stateFromUiLoop
  }

  onSubmit(state) {
    const newState = this.updateOld(state, serverOperations.submit)
    FormUtil.scrollTo(document.getElementById('container'), 1500)
    return newState
  }

  onRemoveField(state, fieldToRemove) {
    const growingParent = FormUtil.findGrowingParent(state.form.content, fieldToRemove.id)
    const answersObject = state.saveStatus.values
    InputValueStorage.deleteValue(growingParent, answersObject, fieldToRemove.id)
    _.remove(growingParent.children, fieldToRemove)

    // Reindex growing fields
    for (var i = 0; i < growingParent.children.length; i++) {
      var child = growingParent.children[i]
      const nodeIndex = i + 1
      child.id = child.id.replace(/-\d+$/, "-" + nodeIndex.toString())
    }

    state.saveStatus.changes = true
    this.startAutoSave(state)
    return state
  }

  onServerError(state, serverErrors) {
    state.saveStatus.saveInProgress = false
    state.saveStatus.serverError = serverErrors.error
    if(serverErrors.validationErrors) {
      state.form.validationErrors = state.form.validationErrors.merge(serverErrors.validationErrors)
    }
    return state
  }
}
