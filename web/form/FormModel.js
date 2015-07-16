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

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState',
  updateField: 'updateField',
  uiStateUpdate: 'uiStateUpdate',
  fieldValidation: 'fieldValidation',
  changeLanguage: 'changeLanguage',
  save: 'save',
  autoSave: 'autoSave',
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

  init() {
    const self = this
    const query = queryString.parse(location.search)
    const langQueryParam =  query.lang || 'fi'
    const previewQueryParam =  query.preview || false
    const develQueryParam =  query.devel || false

    const formValuesP = self.formOperations.containsExistingEntityId(query) ?
      Bacon.fromPromise(qwest.get(self.formOperations.urlCreator.existingFormApiUrlFromQuery(query))).map(function(submission){return submission.answers}) :
      self.formP.map(initDefaultValues)
    const clientSideValidationP = self.formP.map(initClientSideValidationState)
    const translationsP = Bacon.fromPromise(qwest.get("/translations.json"))

    const initialStateTemplate = {
      form: self.formP,
      saveStatus: {
        changes: false,
        saveInProgress: false,
        saveTime: null,
        saveError: "",
        values: formValuesP
      },
      configuration: {
        preview: previewQueryParam,
        develMode: develQueryParam,
        lang: langQueryParam,
        translations: translationsP
      },
      validationErrors: {},
      clientSideValidation: clientSideValidationP
    }
    if (_.isFunction(self.initialStateTemplateTransformation)) {
      self.initialStateTemplateTransformation(initialStateTemplate)
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)
    initialState.onValue(function(state) { dispatcher.push(events.initialState, state) })

    const autoSave = _.debounce(function(){dispatcher.push(events.save)}, develQueryParam? 100 : 3000)

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream(events.initialState)], onInitialState,
                                          [dispatcher.stream(events.updateField)], onUpdateField,
                                          [dispatcher.stream(events.uiStateUpdate)], onUiStateUpdated,
                                          [dispatcher.stream(events.fieldValidation)], onFieldValidation,
                                          [dispatcher.stream(events.changeLanguage)], onChangeLang,
                                          [dispatcher.stream(events.save)], onSave,
                                          [dispatcher.stream(events.autoSave)], onAutoSave,
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
      FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(realInitialState.form.content, realInitialState.saveStatus.values)
      if (_.isFunction(self.onInitialStateLoaded)) {
        self.onInitialStateLoaded(realInitialState)
      }
      return realInitialState
    }

    function onChangeLang(state, lang) {
      state.configuration.lang = lang
      return state
    }

    function onUpdateField(state, fieldUpdate) {
      FieldUpdateHandler.updateStateFromFieldUpdate(state, fieldUpdate)
      if (_.isFunction(self.formOperations.onFieldUpdate)) {
        self.formOperations.onFieldUpdate(state, self, fieldUpdate.field, fieldUpdate.value)
      }
      FieldUpdateHandler.triggerRelatedFieldValidationIfNeeded(state, fieldUpdate)
      const clientSideValidationPassed = state.clientSideValidation[fieldUpdate.id]
      if (clientSideValidationPassed) {
        FormBranchGrower.expandGrowingFieldSetIfNeeded(state, fieldUpdate);
        if (_.isFunction(self.formOperations.onFieldValid)) {
          self.formOperations.onFieldValid(state, self, fieldUpdate.field, fieldUpdate.value)
        }
      }
      state.saveStatus.changes = true
      dispatcher.push(events.autoSave)
      dispatcher.push(events.uiStateUpdate, fieldUpdate)
      return state
    }

    function onUiStateUpdated(state, fieldUpdate) {
      LocalStorage.save(self.formOperations.createUiStateIdentifier, state, fieldUpdate)
      return state
    }

    function onFieldValidation(state, validation) {
      state.clientSideValidation[validation.id] = validation.validationErrors.length === 0
      if (self.isSaveDraftAllowed(state)) {
        state.validationErrors[validation.id] = validation.validationErrors
      }
      return state
    }

    function handleUnexpectedSaveError(method, url, error, event) {
      console.error("Unexpected ", event, " error ", error, " in ", method, " to ", url)
      if (event === events.submit) {
        dispatcher.push(events.saveError, "unexpected-submit-error")
      } else if (event === events.save) {
        dispatcher.push(events.saveError, "unexpected-save-error")
      } else {
        dispatcher.push(events.autoSave)
      }
    }

    function handleSaveError(status, error, method, url, response, event) {
      console.log('handleSaveError : error ', JSON.stringify(error))
      console.log('handleSaveError : response ', JSON.stringify(response))
      if (status === 400) {
        dispatcher.push(events.saveError, "submit-validation-errors",  JSON.parse(response))
      }
      else{
        handleUnexpectedSaveError(method, url, error, event);
      }
    }

    function saveNew(state, onSuccessCallback) {
      var url = self.formOperations.urlCreator.newEntityApiUrl(state)
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
              handleSaveError(this.status, error, "PUT", url, this.response, events.save)
            })
      }
      catch(error) {
        return handleUnexpectedSaveError("PUT", url, error, events.save);
      }
      return state
    }

    function updateOld(stateToSave, event, onSuccessCallback) {
      var url = self.formOperations.urlCreator.existingFormApiUrl(stateToSave)+ (event === events.submit ? "/submit" : "")
      try {
        stateToSave.saveStatus.saveInProgress = true
        qwest.post(url, stateToSave.saveStatus.values, {dataType: "json", async: true})
            .then(function(response) {
              console.log("Saved to server (event=", event, "). Response=", JSON.stringify(response))
              const stateFromServer = _.cloneDeep(stateToSave)
              stateFromServer.saveStatus.values = response["answers"]
              if (onSuccessCallback) {
                onSuccessCallback(stateFromServer)
              }
              dispatcher.push(events.saveCompleted, stateFromServer)
            })
            .catch(function(error) {
              handleSaveError(this.status, error, "POST", url, this.response, event)
            })
      }
      catch(error) {
        handleUnexpectedSaveError("POST", url, error, event);
      }
      return stateToSave
    }

    function onSave(state, params) {
      const onSuccessCallback = params ? params.onSuccessCallback : undefined
      if (self.formOperations.isSaveDraftAllowed(state)) {
        return updateOld(state, events.autoSave, onSuccessCallback)
      }
      else {
        return saveNew(state, onSuccessCallback)
      }
    }

    function onAutoSave(state) {
      if (self.formOperations.isSaveDraftAllowed(state)) {
        state.saveStatus.saveInProgress = true
        autoSave()
      }
      return state
    }

    function onSaveError(state, saveError, serverValidationErrors) {
      state.saveStatus.saveInProgress = false
      state.saveStatus.saveError = saveError
      if(serverValidationErrors) {
        state.validationErros = serverValidationErrors
      }
      return state
    }

    function onSaveCompleted(stateFromUiLoop, stateFromServer) {
      // TODO: Resolve updates from UI with updates from server.
      // At the moment we just discard the values from server here.
      var locallyStoredValues = LocalStorage.load(self.formOperations.createUiStateIdentifier, stateFromServer)
      if (!locallyStoredValues) {
        LocalStorage.save(self.formOperations.createUiStateIdentifier, stateFromServer)
        stateFromServer.saveStatus.saveInProgress = false
        stateFromServer.saveStatus.saveTime = new Date()
        stateFromServer.saveStatus.changes = false
        return stateFromServer
      }
      stateFromUiLoop.saveStatus.changes = !_.isEqual(stateFromUiLoop.saveStatus.values, stateFromServer.saveStatus.values)
      if (_.isFunction(self.formOperations.onSaveCompletedCallback)) {
        self.formOperations.onSaveCompletedCallback(stateFromUiLoop, stateFromServer)
      }
      stateFromUiLoop.saveStatus.saveInProgress = false
      stateFromUiLoop.saveStatus.saveTime = new Date()
      stateFromUiLoop.saveStatus.saveError = ""
      if (stateFromUiLoop.saveStatus.changes) {
        dispatcher.push(events.autoSave)
      }
      return stateFromUiLoop
    }

    function onSubmit(state) {
      return updateOld(state, events.submit)
    }

    function onRemoveField(state, fieldToRemove) {
      const growingParent = FormUtil.findGrowingParent(state.form.content, fieldToRemove.id)
      const answersObject = state.saveStatus.values
      InputValueStorage.deleteValue(growingParent, answersObject, fieldToRemove.id)
      delete state.clientSideValidation[fieldToRemove.id]
      _.remove(growingParent.children, fieldToRemove)
      dispatcher.push(events.autoSave)
      return state
    }
  }

  // Public API

  constructHtmlId(formContent, fieldId) {
    return fieldId // For the time being, our field ids are unique within the form
  }

  changeLanguage(lang) {
    dispatcher.push(events.changeLanguage, lang)
  }

  setFieldValid(id, validationErrors) {
    dispatcher.push(events.fieldValidation, {id: id, validationErrors: validationErrors})
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
    return this.formOperations.isSaveDraftAllowed(state)
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
