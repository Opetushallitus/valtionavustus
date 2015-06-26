import Bacon from 'baconjs'
import _ from 'lodash'
import Dispatcher from './Dispatcher'
import LocalStorage from './LocalStorage.js'
import FormBranchGrower from './FormBranchGrower.js'
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
  saveCompleted: 'saveCompleted',
  submit: 'submit'
}

export default class FormModel {
  constructor(props) {
    this.formOperations = props.formOperations
    this.initialStateTransformation = props.initialStateTransformation
    this.formP = props.formP
    this.setFieldValue = this.setFieldValue.bind(this)
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

    const initialStateObject = {
      form: self.formP,
      saveStatus: {
        changes: false,
        saveInProgress: false,
        saveTime: null,
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
    self.initialStateTransformation(initialStateObject)

    const initialState = Bacon.combineTemplate(initialStateObject)
    initialState.onValue(function(state) { dispatcher.push(events.initialState, state) })

    const autoSave = _.debounce(function(){dispatcher.push(events.save)}, develQueryParam? 100 : 3000)
    function autoSaveIfAllowed(state) {
      if (self.formOperations.isSaveDraftAllowed(state)) {
        state.saveStatus.saveInProgress = true
        autoSave()
      }
    }

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream(events.initialState)], onInitialState,
                                          [dispatcher.stream(events.updateField)], onUpdateField,
                                          [dispatcher.stream(events.uiStateUpdate)], onUiStateUpdated,
                                          [dispatcher.stream(events.fieldValidation)], onFieldValidation,
                                          [dispatcher.stream(events.changeLanguage)], onChangeLang,
                                          [dispatcher.stream(events.save)], onSave,
                                          [dispatcher.stream(events.saveCompleted)], onSaveCompleted,
                                          [dispatcher.stream(events.submit)], onSubmit)

    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function initDefaultValues(form) {
      const values = {}
      const children = form.children ? form.children : form.content
      for(var i=0; i < children.length; i++) {
        const field = children[i]
        if (field.options && field.options.length > 0) {
          values[field.id] = field.options[0].value
        }
        if (field.type === 'wrapperElement') {
          var childValues = initDefaultValues(field)
          for (var fieldId in childValues) {
            values[fieldId] = childValues[fieldId]
          }
        }
      }
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
      return realInitialState
    }

    function onChangeLang(state, lang) {
      state.configuration.lang = lang
      return state
    }

    function onUpdateField(state, fieldUpdate) {
      state.saveStatus.values[fieldUpdate.id] = fieldUpdate.value
      if (fieldUpdate.validationErrors) {
        state.validationErrors[fieldUpdate.id] = fieldUpdate.validationErrors
        state.clientSideValidation[fieldUpdate.id] = fieldUpdate.validationErrors.length === 0
      }
      else {
        state.clientSideValidation[fieldUpdate.id] = true
      }
      const clientSideValidationPassed = state.clientSideValidation[fieldUpdate.id];
      if (clientSideValidationPassed) {
        if (growingFieldSetExpandMustBeTriggered(state, fieldUpdate.id)) {
          expandGrowingFieldset(state, fieldUpdate.id)
        }
        self.formOperations.onFieldValid(state, self, fieldUpdate.id, fieldUpdate.value)
      }
      state.saveStatus.changes = true
      autoSaveIfAllowed(state)
      dispatcher.push(events.uiStateUpdate, fieldUpdate)
      return state
    }

    function growingFieldSetExpandMustBeTriggered(state, fieldId) {
      const growingSetOfThisField = findGrowingParent(state, fieldId)
      if (!growingSetOfThisField) {
        return false
      }

      const allFieldIdsInSameGrowingSet = JsUtil.
        flatFilter(growingSetOfThisField, n => { return !_.isUndefined(n.id) }).
        map(n => { return n.id })
      const wholeSetIsValid = _.reduce(allFieldIdsInSameGrowingSet, (acc, fieldId) => {
        return acc && (state.clientSideValidation[fieldId] !== false)
      }, true)

      // TODO: Assess if the "last" check is needed. Possibly it's enough that the whole thing is valid, minus last row that needs to be skipped in validation, when there are filled rows.
      const lastChildOfGrowingSet = _.last(growingSetOfThisField.children)
      const thisFieldIsInLastChildToBeRepeated = _.some(lastChildOfGrowingSet.children, x => { return x.id === fieldId })

      return wholeSetIsValid && thisFieldIsInLastChildToBeRepeated
    }

    function findGrowingParent(state, fieldId) {
      const allGrowingFieldsets = JsUtil.flatFilter(state.form.content, n => { return n.displayAs === "growingFieldset" })
      return JsUtil.findJsonNodeContainingId(allGrowingFieldsets, fieldId)
    }

    function expandGrowingFieldset(state, fieldId) {
      const growingFieldSet = findGrowingParent(state, fieldId)
      const allExistingFieldIds = JsUtil.flatFilter(state.form.content, n => { return !_.isUndefined(n.id) }).
        map(n => { return n.id })
      const newSet = FormBranchGrower.createNewChild(growingFieldSet, allExistingFieldIds)
      growingFieldSet.children.push(newSet)
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

    function handleUnexpectedSaveError(state, method, url, error, submit) {
      if (submit) {
        console.error("Unexpected save error ", error, " in ", method, " to ", url)
        state.validationErrors["submit"] = [{error: "unexpected-submit-error"}]
      } else {
        autoSaveIfAllowed(state)
      }
      return state
    }

    function handleSaveError(state, status, error, method, url, response, submit) {
      state.saveStatus.saveInProgress = false
      if (status === 400) {
        state.validationErrors = JSON.parse(response)
        state.validationErrors["submit"] = [{error: "validation-errors"}]
        return state
      }
      return handleUnexpectedSaveError(state, method, url, error, submit);
    }

    function saveNew(state, onSuccessCallback) {
      var url = self.formOperations.urlCreator.newEntityApiUrl(state)
      try {
        state.saveStatus.saveInProgress = true
        qwest.put(url, state.saveStatus.values, {dataType: "json", async: true})
            .then(function(response) {
              console.log("State saved. Response=", response)
              if (onSuccessCallback) {
                onSuccessCallback(state, response)
              }
              var stateSkeletonFromServer = _.cloneDeep(state)
              stateSkeletonFromServer.saveStatus.values = null // state from server is not loaded at all on initial save, so this will be null
              dispatcher.push(events.saveCompleted, stateSkeletonFromServer)
            })
            .catch(function(error) {
              handleSaveError(state, this.status, error, this.method, url, this.response)
            })
      }
      catch(error) {
        return handleUnexpectedSaveError(state, "PUT", url, error);
      }
      state.saveStatus.changes = false
      return state
    }

    function updateOld(stateToSave, submit, onSuccessCallback) {
      var url = self.formOperations.urlCreator.existingFormApiUrl(stateToSave)+ (submit ? "/submit" : "")
      try {
        stateToSave.saveStatus.saveInProgress = true
        qwest.post(url, stateToSave.saveStatus.values, {dataType: "json", async: true})
            .then(function(response) {
              console.log("Saved to server (submit=", submit, "). Response=", response)
              stateToSave.saveStatus.values = response["answers"]
              if (onSuccessCallback) {
                onSuccessCallback(stateToSave)
              }
              dispatcher.push(events.saveCompleted, stateToSave)
            })
            .catch(function(error) {
              handleSaveError(stateToSave, this.status, error, this.method, url, this.response, submit)
            })
      }
      catch(error) {
        handleUnexpectedSaveError(stateToSave, "POST", url, error, submit);
      }
      stateToSave.saveStatus.changes = false
      return stateToSave
    }

    function onSave(state, params) {
      const onSuccessCallback = params ? params.onSuccessCallback : undefined
      if (self.formOperations.isSaveDraftAllowed(state)) {
        return updateOld(state, false, onSuccessCallback)
      }
      else {
        return saveNew(state, onSuccessCallback)
      }
    }

    function onSaveCompleted(stateFromUiLoop, stateFromServer) {
      // TODO: Resolve updates from UI with updates from server.
      // At the moment we just discard the values from server here.
      var locallyStoredState = LocalStorage.load(self.formOperations.createUiStateIdentifier, stateFromServer)
      if (!locallyStoredState) {
        LocalStorage.save(self.formOperations.createUiStateIdentifier, stateFromServer)
        stateFromServer.saveStatus.saveInProgress = false
        stateFromServer.saveStatus.saveTime = new Date()
        stateFromServer.saveStatus.changes = false
        return stateFromServer
      }
      locallyStoredState.saveStatus.changes = !_.isEqual(locallyStoredState.saveStatus.values, stateFromServer.saveStatus.values)
      self.formOperations.onSaveCompletedCallback(locallyStoredState, stateFromServer)
      locallyStoredState.saveStatus.saveInProgress = false
      locallyStoredState.saveStatus.saveTime = new Date()
      locallyStoredState.validationErrors["submit"] = []
      if (locallyStoredState.saveStatus.changes) {
        autoSaveIfAllowed(locallyStoredState)
      }
      return locallyStoredState
    }

    function onSubmit(state) {
      return updateOld(state, true)
    }
  }

  // Public API
  changeLanguage(lang) {
    dispatcher.push(events.changeLanguage, lang)
  }

  setFieldValue(id, value, validationErrors) {
    dispatcher.push(events.updateField, {id: id, value: value, validationErrors: validationErrors})
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

  componentOnChangeListener(fieldId, newValue, syntaxValidator) {
    var errors = []
    if (syntaxValidator) {
      errors = syntaxValidator(newValue)
    }
    dispatcher.push(events.updateField, {id: fieldId, value: newValue, validationErrors: errors})
  }

  componentDidMount(fieldId, initialValue, syntaxValidator) {
    var errors = []
    if (syntaxValidator) {
      errors = syntaxValidator(initialValue)
    }
    dispatcher.push(events.fieldValidation, {id: fieldId, validationErrors: errors})
  }

  isSaveDraftAllowed(state) {
    return this.formOperations.isSaveDraftAllowed(state)
  }
}
