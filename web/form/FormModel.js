import Bacon from 'baconjs'
import _ from 'lodash'
import Dispatcher from './Dispatcher'
import LocalStorage from './LocalStorage.js'
import FormBranchGrower from './FormBranchGrower.js'
import InputValueStorage from './InputValueStorage.js'
import {FieldUpdateHandler} from './FieldUpdateHandler.js'
import FormUtil from './FormUtil.js'
import {SyntaxValidator} from './SyntaxValidator.js'
import JsUtil from './JsUtil.js'

import qwest from 'qwest'
import queryString from 'query-string'
import traverse from 'traverse'
import Immutable from 'seamless-immutable'

const dispatcher = new Dispatcher()

const saveTypes = {
  initialSave: 'initialSave',
  autoSave: 'autoSave',
  submit: 'submit'
}

const events = {
  initialState: 'initialState',
  updateField: 'updateField',
  fieldValidation: 'fieldValidation',
  changeLanguage: 'changeLanguage',
  save: 'save',
  initAutoSave: 'initAutoSave',
  saveCompleted: 'saveCompleted',
  saveError: 'saveError',
  submit: 'submit',
  removeField: 'removeField'
}

export default class FormModel {
  constructor(props) {
    this.formOperations = props.formOperations
    this.initialStateTemplateTransformation = props.initialStateTemplateTransformation
    this.onInitialStateLoaded = props.onInitialStateLoaded
    this.formP = props.formP
    this.customComponentFactory = props.customComponentFactory
    this.customPreviewComponentFactory = props.customPreviewComponentFactory
  }

  static initialize(model) {
    const query = queryString.parse(location.search)
    const langQueryParam =  query.lang || 'fi'
    const previewQueryParam =  query.preview || false
    const develQueryParam =  query.devel || false

    const clientSideValidationP = model.formP.map(initClientSideValidationState)
    const translationsP = Bacon.fromPromise(qwest.get("/translations.json"))

    const initialStateTemplate = {
      form: model.formP,
      saveStatus: {
        changes: false,
        saveInProgress: false,
        saveTime: null,
        saveError: "",
        values: getInitialFormValuesPromise(model.formOperations, model.formP)
      },
      configuration: {
        preview: previewQueryParam,
        develMode: develQueryParam,
        lang: langQueryParam,
        translations: translationsP
      },
      validationErrors: Immutable({}),
      clientSideValidation: clientSideValidationP,
      extensionApi: {
        formOperations: model.formOperations,
        onInitialStateLoaded: model.onInitialStateLoaded
      }
    }
    if (_.isFunction(model.initialStateTemplateTransformation)) {
      model.initialStateTemplateTransformation(initialStateTemplate)
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)
    initialState.onValue(function(state) { dispatcher.push(events.initialState, state) })

    const autoSave = _.debounce(function(){dispatcher.push(events.save)}, develQueryParam? 100 : 3000)

    function startAutoSave(state) {
      const formOperations = state.extensionApi.formOperations
      if (formOperations.isSaveDraftAllowed(state)) {
        state.saveStatus.saveInProgress = true
        autoSave()
      }
      return state
    }

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream(events.initialState)], onInitialState,
                                          [dispatcher.stream(events.updateField)], onUpdateField,
                                          [dispatcher.stream(events.fieldValidation)], onFieldValidation,
                                          [dispatcher.stream(events.changeLanguage)], onChangeLang,
                                          [dispatcher.stream(events.save)], onSave,
                                          [dispatcher.stream(events.initAutoSave)], onInitAutoSave,
                                          [dispatcher.stream(events.saveCompleted)], onSaveCompleted,
                                          [dispatcher.stream(events.saveError)], onSaveError,
                                          [dispatcher.stream(events.submit)], onSubmit,
                                          [dispatcher.stream(events.removeField)], onRemoveField)

    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function initDefaultValues(form) {
      const values = {}
      const fields = JsUtil.flatFilter(form.content, n => { return !_.isUndefined(n.id) })
      _.forEach(fields, f => {
        if (!_.isEmpty(f.options)) {
          InputValueStorage.writeValue(form.content, values, f.id, f.options[0].value)
        }
      })
      return values
    }

    function initClientSideValidationState(form) {
      const values = {}
      const children = form.children ? form.children : form.content
      for (var i = 0; i < children.length; i++) {
        const field = children[i]
        if (field.type === 'formField') {
          values[field.id] = false
        } else if (field.type === 'wrapperElement') {
          var childValues = initClientSideValidationState(field)
          for (var fieldId in childValues) {
            values[fieldId] = childValues[fieldId]
          }
        }
      }
      return values
    }

    function onInitialState(state, realInitialState) {
      const onInitialStateLoaded = realInitialState.extensionApi.onInitialStateLoaded
      FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(realInitialState.form.content, realInitialState.saveStatus.values)
      if (_.isFunction(onInitialStateLoaded)) {
        onInitialStateLoaded(realInitialState)
      }
      return realInitialState
    }

    function onChangeLang(state, lang) {
      state.configuration.lang = lang
      return state
    }

    function onUpdateField(state, fieldUpdate) {
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
          formOperations.onFieldValid(state, model, fieldUpdate.field, fieldUpdate.value)
        }
      }
      state.saveStatus.changes = true
      LocalStorage.save(formOperations.createUiStateIdentifier, state, fieldUpdate)
      startAutoSave(state)
      return state
    }

    function onFieldValidation(state, validation) {
      state.clientSideValidation[validation.id] = validation.validationErrors.length === 0
      if (state.extensionApi.formOperations.isSaveDraftAllowed(state)) {
        state.validationErrors = state.validationErrors.merge({[validation.id]: validation.validationErrors})
      }
      return state
    }

    function handleUnexpectedSaveError(method, url, error, saveType) {
      console.error("Unexpected ", saveType, " error ", error, " in ", method, " to ", url)
      if (saveType === saveTypes.submit) {
        dispatcher.push(events.saveError, "unexpected-submit-error")
      } else if (saveType === saveTypes.initialSave) {
        dispatcher.push(events.saveError, "unexpected-save-error")
      } else {
        dispatcher.push(events.initAutoSave)
      }
    }

    function handleSaveError(status, error, method, url, response, saveType) {
      console.log('handleSaveError : error ', JSON.stringify(error))
      console.log('handleSaveError : response ', JSON.stringify(response))
      if (status === 400) {
        dispatcher.push(events.saveError, "submit-validation-errors",  JSON.parse(response))
      }
      else{
        handleUnexpectedSaveError(method, url, error, saveType)
      }
    }

    function saveNew(state, onSuccessCallback) {
      const formOperations = state.extensionApi.formOperations
      const url = formOperations.urlCreator.newEntityApiUrl(state)
      try {
        state.saveStatus.saveInProgress = true
        qwest.put(url, state.saveStatus.values, {dataType: "json", async: true})
            .then(function(response) {
              console.log("State saved. Response=", JSON.stringify(response))
              if (onSuccessCallback) {
                onSuccessCallback(state, response)
              }
              var stateSkeletonFromServer = _.cloneDeep(state)
              stateSkeletonFromServer.saveStatus.values = null // state from server is not loaded at all on initial save, so this will be null
              dispatcher.push(events.saveCompleted, stateSkeletonFromServer)
            })
            .catch(function(error) {
              handleSaveError(this.status, error, "PUT", url, this.response, saveTypes.initialSave)
            })
      }
      catch(error) {
        return handleUnexpectedSaveError("PUT", url, error, saveTypes.initialSave);
      }
      return state
    }

    function updateOld(state, saveType, onSuccessCallback) {
      const formOperations = state.extensionApi.formOperations
      const url = formOperations.urlCreator.existingFormApiUrl(state)+ (saveType === saveTypes.submit ? "/submit" : "")
      try {
        state.saveStatus.saveInProgress = true
        qwest.post(url, state.saveStatus.values, {dataType: "json", async: true})
            .then(function(response) {
              console.log("Saved to server (", saveType, "). Response=", JSON.stringify(response))
              const updatedState = _.cloneDeep(state)
              updatedState.saveStatus.values = response["answers"]
              if (onSuccessCallback) {
                onSuccessCallback(updatedState)
              }
              dispatcher.push(events.saveCompleted, updatedState)
            })
            .catch(function(error) {
              handleSaveError(this.status, error, "POST", url, this.response, saveType)
            })
      }
      catch(error) {
        handleUnexpectedSaveError("POST", url, error, saveType);
      }
      return state
    }

    function onSave(state, params) {
      const onSuccessCallback = params ? params.onSuccessCallback : undefined
      const formOperations = state.extensionApi.formOperations
      if (formOperations.isSaveDraftAllowed(state)) {
        return updateOld(state, saveTypes.autoSave, onSuccessCallback)
      }
      else {
        return saveNew(state, onSuccessCallback)
      }
    }

    function onInitAutoSave(state) {
      startAutoSave(state)
    }

    function onSaveError(state, saveError, serverValidationErrors) {
      state.saveStatus.saveInProgress = false
      state.saveStatus.saveError = saveError
      if(serverValidationErrors) {
        state.validationErrors = Immutable(serverValidationErrors)
      }
      return state
    }

    function onSaveCompleted(stateFromUiLoop, stateWithServerChanges) {
      // TODO: Resolve updates from UI with updates from server.
      // At the moment we just discard the values from server here.
      const formOperations = stateFromUiLoop.extensionApi.formOperations
      var locallyStoredValues = LocalStorage.load(formOperations.createUiStateIdentifier, stateWithServerChanges)
      if (!locallyStoredValues) {
        LocalStorage.save(formOperations.createUiStateIdentifier, stateWithServerChanges)
        stateWithServerChanges.saveStatus.saveInProgress = false
        stateWithServerChanges.saveStatus.saveTime = new Date()
        stateWithServerChanges.saveStatus.changes = false
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
        startAutoSave(stateFromUiLoop)
      }
      return stateFromUiLoop
    }

    function onSubmit(state) {
      return updateOld(state, saveTypes.submit)
    }

    function onRemoveField(state, fieldToRemove) {
      const growingParent = FormUtil.findGrowingParent(state.form.content, fieldToRemove.id)
      const answersObject = state.saveStatus.values
      InputValueStorage.deleteValue(growingParent, answersObject, fieldToRemove.id)
      delete state.clientSideValidation[fieldToRemove.id]
      _.remove(growingParent.children, fieldToRemove)
      startAutoSave(state)
      return state
    }

    function getInitialFormValuesPromise(formOperations, formP) {
      if (formOperations.containsExistingEntityId(query)) {
        return Bacon.fromPromise(
          qwest.get(formOperations.urlCreator.existingFormApiUrlFromQuery(query))
        ).map(function(submission){return submission.answers})
      }
      return formP.map(initDefaultValues)
    }
  }

  // Public API

  constructHtmlId(formContent, fieldId) {
    return fieldId // For the time being, our field ids are unique within the form
  }

  changeLanguage(lang) {
    dispatcher.push(events.changeLanguage, lang)
  }

  submit(event) {
    event.preventDefault()
    dispatcher.push(events.submit)
  }

  saveImmediately(callback) {
    dispatcher.push(events.save, { onSuccessCallback: callback })
  }

  hasPendingChanges(state) {
    return state.saveStatus.changes || state.saveStatus.saveInProgress
  }

  componentOnChangeListener(field, newValue) {
    dispatcher.push(events.updateField, FieldUpdateHandler.createFieldUpdate(field, newValue))
  }

  componentDidMount(field, initialValue) {
    if (field.skipValidationOnMount) {
      field.skipValidationOnMount = false
      return
    }
    dispatcher.push(events.fieldValidation, {id: field.id, validationErrors: SyntaxValidator.validateSyntax(field, initialValue)})
  }

  isSaveDraftAllowed(state) {
    const formOperations = state.extensionApi.formOperations
    return formOperations.isSaveDraftAllowed(state)
  }

  removeField(field) {
    dispatcher.push(events.removeField, field)
  }

  getCustomComponentTypeMapping() {
    return this.customComponentFactory ? this.customComponentFactory.fieldTypeMapping : {}
  }

  createCustomComponent(componentProps) {
    if (!this.customComponentFactory) {
      throw new Error("To create a custom field, supply customComponentFactory to FormModel")
    }
    return this.customComponentFactory.createComponent(componentProps)
  }

  getCustomPreviewComponentTypeMapping() {
    return this.customPreviewComponentFactory ? this.customPreviewComponentFactory.fieldTypeMapping : {}
  }

  createCustomPreviewComponent(componentProps) {
    if (!this.customPreviewComponentFactory) {
      throw new Error("To create a custom field, supply customComponentFactory to FormModel")
    }
    return this.customPreviewComponentFactory.createComponent(componentProps)
  }

  getCustomWrapperComponentProperties(state) {
    return this.customComponentFactory ? this.customComponentFactory.getCustomWrapperComponentProperties(state) : {}
  }
}
