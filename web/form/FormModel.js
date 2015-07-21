import Bacon from 'baconjs'
import _ from 'lodash'
import qwest from 'qwest'
import queryString from 'query-string'
import traverse from 'traverse'
import Immutable from 'seamless-immutable'

import Dispatcher from './Dispatcher'
import InputValueStorage from './InputValueStorage.js'
import FieldUpdateHandler from './FieldUpdateHandler.js'
import FormUtil from './FormUtil.js'
import SyntaxValidator from './SyntaxValidator.js'
import JsUtil from './JsUtil.js'
import FormStateTransitions from './FormStateTransitions.js'

const dispatcher = new Dispatcher()

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
    this.initialStateTemplateTransformation = props.initialStateTemplateTransformation
    this.onInitialStateLoaded = props.onInitialStateLoaded
    this.formP = props.formP
    this.customComponentFactory = props.customComponentFactory
    this.customPreviewComponentFactory = props.customPreviewComponentFactory
  }

  static initialize(model, formOperations) {
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
        values: getInitialFormValuesPromise(formOperations, model.formP)
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
        formOperations: formOperations,
        onInitialStateLoaded: model.onInitialStateLoaded
      }
    }
    if (_.isFunction(model.initialStateTemplateTransformation)) {
      model.initialStateTemplateTransformation(initialStateTemplate)
    }

    const initialState = Bacon.combineTemplate(initialStateTemplate)
    initialState.onValue(function(state) { dispatcher.push(events.initialState, state) })

    const stateTransitions = new FormStateTransitions(dispatcher, events, develQueryParam)
    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream(events.initialState)], (...args) => stateTransitions.onInitialState(...args),
                                          [dispatcher.stream(events.updateField)], (...args) => stateTransitions.onUpdateField(...args),
                                          [dispatcher.stream(events.fieldValidation)], (...args) => stateTransitions.onFieldValidation(...args),
                                          [dispatcher.stream(events.changeLanguage)], (...args) => stateTransitions.onChangeLang(...args),
                                          [dispatcher.stream(events.save)], (...args) => stateTransitions.onSave(...args),
                                          [dispatcher.stream(events.initAutoSave)], (...args) => stateTransitions.onInitAutoSave(...args),
                                          [dispatcher.stream(events.saveCompleted)], (...args) => stateTransitions.onSaveCompleted(...args),
                                          [dispatcher.stream(events.saveError)], (...args) => stateTransitions.onSaveError(...args),
                                          [dispatcher.stream(events.submit)], (...args) => stateTransitions.onSubmit(...args),
                                          [dispatcher.stream(events.removeField)], (...args) => stateTransitions.onRemoveField(...args))

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
    this.initFieldValidation(field, initialValue, false)
  }

  initFieldValidation(field, value, showErrorsAlways) {
    dispatcher.push(events.fieldValidation, {id: field.id, validationErrors: SyntaxValidator.validateSyntax(field, value), showErrorsAlways: showErrorsAlways})
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
