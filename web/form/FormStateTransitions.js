import _ from 'lodash'
import Immutable from 'seamless-immutable'

import LocalStorage from './LocalStorage.js'
import InputValueStorage from './InputValueStorage.js'
import HttpUtil from './HttpUtil.js'
import FormUtil from './FormUtil.js'
import FormBranchGrower from './FormBranchGrower.js'
import FieldUpdateHandler from './FieldUpdateHandler.js'

const saveTypes = {
  initialSave: 'initialSave',
  autoSave: 'autoSave',
  submit: 'submit'
}

export default class FormStateTransitions {
  constructor(dispatcher, events, develQueryParam) {
    this.dispatcher = dispatcher
    this.events = events
    this.autoSave = _.debounce(function(){ dispatcher.push(events.save) }, develQueryParam? 100 : 3000)
    this._bind(
      'startAutoSave', 'onInitialState', 'onUpdateField', 'onFieldValidation', 'onChangeLang', 'saveNew', 'updateOld', 'onSave',
      'onBeforeUnload', 'onInitAutoSave', 'onSaveCompleted', 'onSaveCompleted', 'onSubmit', 'onRemoveField', 'onSaveError')
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
    return realInitialState
  }

  onUpdateField(state, fieldUpdate) {
    const formOperations = state.extensionApi.formOperations
    FieldUpdateHandler.updateStateFromFieldUpdate(state, fieldUpdate)
    if (_.isFunction(formOperations.onFieldUpdate)) {
      formOperations.onFieldUpdate(state, fieldUpdate.field, fieldUpdate.value)
    }
    FieldUpdateHandler.triggerRelatedFieldValidationIfNeeded(state, fieldUpdate)
    const clientSideValidationPassed = state.clientSideValidation[fieldUpdate.id]
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
    state.clientSideValidation[validation.id] = validation.validationErrors.length === 0
    if (validation.showErrorsAlways || state.extensionApi.formOperations.isSaveDraftAllowed(state)) {
      state.validationErrors = state.validationErrors.merge({[validation.id]: validation.validationErrors})
    }
    return state
  }

  onChangeLang(state, lang) {
    state.configuration.lang = lang
    return state
  }

  static handleUnexpectedSaveError(dispatcher, events, method, url, error, saveType) {
    console.error('Unexpected', saveType, 'error', error, 'in', method, 'to', url)
    if (saveType === saveTypes.submit) {
      dispatcher.push(events.saveError, {error: "unexpected-submit-error"})
    } else if (saveType === saveTypes.initialSave) {
      dispatcher.push(events.saveError, {error: "unexpected-save-error"})
    } else {
      dispatcher.push(events.initAutoSave)
    }
  }

  static handleSaveError(dispatcher, events, status, error, method, url, response, saveType) {
    console.warn('Handle', saveType, 'error', error, 'in', method, 'to', url, 'with status', status, 'and response', JSON.stringify(response))
    if (status === 400) {
      dispatcher.push(events.saveError, {error: "submit-validation-errors", validationErrors: response})
    }
    else{
      FormStateTransitions.handleUnexpectedSaveError(dispatcher, events, method, url, error, saveType)
    }
  }

  saveNew(state, onSuccessCallback) {
    const formOperations = state.extensionApi.formOperations
    const url = formOperations.urlCreator.newEntityApiUrl(state)
    const dispatcher = this.dispatcher
    const events = this.events
    try {
      state.saveStatus.saveInProgress = true
      HttpUtil.put(url, state.saveStatus.values)
        .then(function(response) {
          console.log("State saved. Response=", JSON.stringify(response))
          if (onSuccessCallback) {
            onSuccessCallback(state, response)
          }
          var stateSkeletonFromServer = _.cloneDeep(state)
          stateSkeletonFromServer.saveStatus.values = null // state from server is not loaded at all on initial save, so this will be null
          stateSkeletonFromServer.validationErrors = Immutable(stateSkeletonFromServer.validationErrors)
          dispatcher.push(events.saveCompleted, stateSkeletonFromServer)
        })
        .catch(function(response) {
            FormStateTransitions.handleSaveError(dispatcher, events, response.status, response.statusText, "PUT", url, response.data, saveTypes.initialSave)
        })
    }
    catch(error) {
      return FormStateTransitions.handleUnexpectedSaveError(dispatcher, events, "PUT", url, error, saveTypes.initialSave);
    }
    return state
  }

  updateOld(state, saveType, onSuccessCallback) {
    const formOperations = state.extensionApi.formOperations
    const url = formOperations.urlCreator.existingFormApiUrl(state)+ (saveType === saveTypes.submit ? "/submit" : "")
    const dispatcher = this.dispatcher
    const events = this.events
    try {
      state.saveStatus.saveInProgress = true
      HttpUtil.post(url, state.saveStatus.values)
        .then(function(response) {
          console.log("Saved to server (", saveType, "). Response=", JSON.stringify(response))
          const updatedState = _.cloneDeep(state)
          updatedState.saveStatus.values = formOperations.responseParser.getFormAnswers(response)
          updatedState.validationErrors = Immutable(updatedState.validationErrors)
          if (onSuccessCallback) {
            onSuccessCallback(updatedState)
          }
          dispatcher.push(events.saveCompleted, updatedState)
        })
        .catch(function(response) {
            FormStateTransitions.handleSaveError(dispatcher, events, response.status, response.statusText, "POST", url, response.data, saveType)
        })
    }
    catch(error) {
      FormStateTransitions.handleUnexpectedSaveError(dispatcher, events, "POST", url, error, saveType);
    }
    return state
  }

  onSave(state, params) {
    const onSuccessCallback = params ? params.onSuccessCallback : undefined
    const formOperations = state.extensionApi.formOperations
    if (formOperations.isSaveDraftAllowed(state)) {
      return this.updateOld(state, saveTypes.autoSave, onSuccessCallback)
    } else {
      return this.saveNew(state, onSuccessCallback)
    }
  }

  onBeforeUnload(state) {
    const formOperations = state.extensionApi.formOperations
    if (formOperations.isSaveDraftAllowed(state)) {
      return this.updateOld(state, saveTypes.autoSave)
    }
  }

  onInitAutoSave(state) {
    this.startAutoSave(state)
  }

  onSaveCompleted(stateFromUiLoop, stateWithServerChanges) {
    // TODO: Resolve updates from UI with updates from server.
    // At the moment we just discard the values from server here.
    const formOperations = stateFromUiLoop.extensionApi.formOperations
    var locallyStoredValues = LocalStorage.load(formOperations.createUiStateIdentifier, stateWithServerChanges)
    if (!locallyStoredValues) {
      LocalStorage.save(formOperations.createUiStateIdentifier, stateWithServerChanges)
      stateWithServerChanges.saveStatus.saveInProgress = false
      stateWithServerChanges.saveStatus.saveTime = new Date()
      stateWithServerChanges.saveStatus.changes = false
      stateWithServerChanges.saveStatus.saveError = ""
      return stateWithServerChanges
    }
    stateFromUiLoop.saveStatus.changes = !_.isEqual(stateFromUiLoop.saveStatus.values, stateWithServerChanges.saveStatus.values)
    if (_.isFunction(formOperations.onSaveCompletedCallback)) {
      formOperations.onSaveCompletedCallback(stateFromUiLoop, stateWithServerChanges)
    }
    stateFromUiLoop.saveStatus.saveInProgress = false
    stateFromUiLoop.saveStatus.saveTime = new Date()
    stateFromUiLoop.saveStatus.saveError = ""
    if (stateFromUiLoop.saveStatus.changes) {
      this.startAutoSave(stateFromUiLoop)
    }
    return stateFromUiLoop
  }

  onSubmit(state) {
    return this.updateOld(state, saveTypes.submit)
  }

  onRemoveField(state, fieldToRemove) {
    const growingParent = FormUtil.findGrowingParent(state.form.content, fieldToRemove.id)
    const answersObject = state.saveStatus.values
    InputValueStorage.deleteValue(growingParent, answersObject, fieldToRemove.id)
    delete state.clientSideValidation[fieldToRemove.id]
    _.remove(growingParent.children, fieldToRemove)
    this.startAutoSave(state)
    return state
  }

  onSaveError(state, serverErrors) {
    state.saveStatus.saveInProgress = false
    state.saveStatus.saveError = serverErrors.error
    if(serverErrors.validationErrors) {
      state.validationErrors = state.validationErrors.merge(serverErrors.validationErrors)
    }
    return state
  }
}