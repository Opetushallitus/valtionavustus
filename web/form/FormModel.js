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
      addFormFieldsForGrowingFields(realInitialState.form.content, realInitialState.saveStatus.values)
      return realInitialState
    }

    function addFormFieldsForGrowingFields(formContent, answers) {
      function populateRepeatingItem(baseObject, key, valueOfElement) {
        _.assign(baseObject, { "id": key })
        baseObject.children = baseObject.children.map(c => {
          const primitiveElement = _.cloneDeep(c)
          const distinguisherOfElement = _.last(primitiveElement.id.split('.')) // e.g. "email"
          _.forEach(_.keys(valueOfElement), k => {
            if (_.endsWith(k, '.' + distinguisherOfElement)) {
              primitiveElement.id = k
            }
          })
          return primitiveElement
        })
        return baseObject
      }

      function populateGrowingSet(growingParentElement, valuesTreeOfElement) {
        if (growingParentElement.children.length === 0) {
          throw new Error("Expected an existing child for growing set '" + growingParentElement.id + "' to get the field configurations from there.")
        }
        const childPrototype = growingParentElement.children[0]
        growingParentElement.children = _.map(_.sortBy(_.keys(valuesTreeOfElement)), k => {
          const o = {}
          _.assign(o, childPrototype)
          populateRepeatingItem(o, k, valuesTreeOfElement[k])
          return o
        })
      }

      _.forEach(JsUtil.flatFilter(formContent, n => { return n.displayAs === "growingFieldset"}), g => {
        if (!_.isUndefined(answers[g.id])) {
          populateGrowingSet(g, answers[g.id])
        }
        const emptyPlaceHolderChild = FormBranchGrower.createNewChild(g)
        g.children.push(emptyPlaceHolderChild)
      })
    }


    function onChangeLang(state, lang) {
      state.configuration.lang = lang
      return state
    }

    function onUpdateField(state, fieldUpdate) {
      updateStateFromFieldUpdate(state, fieldUpdate)
      triggerRelatedFieldValidationIfNeeded(state, fieldUpdate)
      const clientSideValidationPassed = state.clientSideValidation[fieldUpdate.id]
      if (clientSideValidationPassed) {
        if (growingFieldSetExpandMustBeTriggered(state, fieldUpdate)) {
          expandGrowingFieldset(state, fieldUpdate)
        }
        self.formOperations.onFieldValid(state, self, fieldUpdate.id, fieldUpdate.value)
      }
      state.saveStatus.changes = true
      autoSaveIfAllowed(state)
      dispatcher.push(events.uiStateUpdate, fieldUpdate)
      return state
    }

    function growingFieldSetExpandMustBeTriggered(state, fieldUpdate) {
      const growingSetOfThisField = fieldUpdate.growingParent
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
      const thisFieldIsInLastChildToBeRepeated = _.some(lastChildOfGrowingSet.children, x => { return x.id === fieldUpdate.id })

      return wholeSetIsValid && thisFieldIsInLastChildToBeRepeated
    }

    function expandGrowingFieldset(state, fieldUpdate) {
      const growingFieldSet = fieldUpdate.growingParent
      const allExistingFieldIds = JsUtil.flatFilter(state.form.content, n => { return !_.isUndefined(n.id) }).
        map(n => { return n.id })
      const newSet = FormBranchGrower.createNewChild(growingFieldSet)
      growingFieldSet.children.push(newSet)
    }

    function triggerRelatedFieldValidationIfNeeded(state, triggeringFieldUpdate) {
      const growingFieldSet = triggeringFieldUpdate.growingParent
      if (growingFieldSet) {
        const triggeringFieldId = triggeringFieldUpdate.id
        const myGroup = JsUtil.findJsonNodeContainingId(growingFieldSet.children, triggeringFieldId)
        const fieldsToValidate = JsUtil.flatFilter(myGroup, f => { return !_.isUndefined(f.id) && f.type === "formField" && f.id !== triggeringFieldId })
        _.forEach(fieldsToValidate, relatedField => {
          const relatedFieldValue = self.readFieldValue(state.form.content, state.saveStatus.values, relatedField.id)
          const relatedFieldUpdate = FormModel.createFieldUpdate(relatedField, relatedFieldValue)
          updateStateFromFieldUpdate(state, relatedFieldUpdate)
        })
        return !_.isEmpty(fieldsToValidate)
      }
      return false
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


    function writeFieldValue(state, fieldUpdate) {
      function addChildObjectIfDoesNotExist(parentObject, childId) {
        if (!parentObject[childId]) {
          parentObject[childId] = {}
        }
      }
      const answersObject = state.saveStatus.values
      if (!fieldUpdate.growingParent) {
        answersObject[fieldUpdate.id] = fieldUpdate.value
        return
      }
      addChildObjectIfDoesNotExist(answersObject, fieldUpdate.growingParent.id)
      const groupOfField = JsUtil.findJsonNodeContainingId(fieldUpdate.growingParent.children, fieldUpdate.id)
      addChildObjectIfDoesNotExist(answersObject[fieldUpdate.growingParent.id], groupOfField.id)
      answersObject[fieldUpdate.growingParent.id][groupOfField.id][fieldUpdate.id] = fieldUpdate.value
    }

    function updateStateFromFieldUpdate(state, fieldUpdate) {
      _.assign(fieldUpdate, { growingParent: FormModel.findGrowingParent(state.form.content, fieldUpdate.id) })
      writeFieldValue(state, fieldUpdate)
      if (fieldUpdate.validationErrors) {
        state.validationErrors[fieldUpdate.id] = fieldUpdate.validationErrors
        state.clientSideValidation[fieldUpdate.id] = fieldUpdate.validationErrors.length === 0
      } else {
        state.clientSideValidation[fieldUpdate.id] = true
      }
    }
  }

  static createFieldUpdate(field, value) {
    return {id: field.id, value: value, validationErrors: FormModel.validateSyntax(field, value)};
  }

  static validateSyntax(field, value) {
    var validationErrors = []
    if (field.required && (!value || _.trim(value).length < 1)) {
      validationErrors = [{error: "required"}]
    }

    if (field.displayAs === 'emailField' && value) {
      var emailError = FormModel.validateEmail(value);
      if (emailError) {
        validationErrors.push(emailError)
      }
    }

    return validationErrors
  }

  static validateEmail(input) {
    function lastPartIsLongerThanOne(email) {
      const parts = email.split('\.')
      return parts[parts.length -1].length > 1
    }
    // Pretty basic regexp, allows anything@anything.anything
    const validEmailRegexp = /\S+@\S+\.\S+/
    const validEmail = validEmailRegexp.test(input) && lastPartIsLongerThanOne(input)
    return validEmail ? undefined : {error: "email"};
  }

  static findGrowingParent(formContent, fieldId) {
    const allGrowingFieldsets = JsUtil.flatFilter(formContent, n => { return n.displayAs === "growingFieldset" })
    return JsUtil.findJsonNodeContainingId(allGrowingFieldsets, fieldId)
  }

  // Public API
  readFieldValue(formContent, answers, fieldId) {
    const growingParentOfField = FormModel.findGrowingParent(formContent, fieldId)
    if (!growingParentOfField) {
      return answers[fieldId]
    }
    const foundParentArray = JsUtil.flatFilter(answers, n => { return !_.isUndefined(n[fieldId]) })
    if (foundParentArray.length === 0) {
      return ""
    }
    return foundParentArray[0][fieldId]
  }

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
    dispatcher.push(events.updateField, FormModel.createFieldUpdate(field, newValue))
  }

  componentDidMount(field, initialValue) {
    if (field.skipValidationOnMount) {
      field.skipValidationOnMount = false
      return
    }
    dispatcher.push(events.fieldValidation, {id: field.id, validationErrors: FormModel.validateSyntax(field, initialValue)})
  }

  isSaveDraftAllowed(state) {
    return this.formOperations.isSaveDraftAllowed(state)
  }
}
