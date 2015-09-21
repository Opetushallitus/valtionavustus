import queryString from 'query-string'

import Dispatcher from 'va-common/web/Dispatcher'

import FieldUpdateHandler from './FieldUpdateHandler.js'
import SyntaxValidator from './SyntaxValidator.js'
import FormStateTransitions from './FormStateTransitions.js'
import FormStateLoop from './FormStateLoop.js'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState',
  updateField: 'updateField',
  fieldValidation: 'fieldValidation',
  changeLanguage: 'changeLanguage',
  save: 'save',
  initAutoSave: 'initAutoSave',
  saveCompleted: 'saveCompleted',
  serverError: 'serverError',
  submit: 'submit',
  removeField: 'removeField',
  beforeUnload: 'beforeUnload',
  startFileUpload: 'startFileUpload',
  attachmentUploadCompleted: 'attachmentUploadCompleted',
  removeFile: 'removeFile',
  fileDeleteCompleted: 'fileDeleteCompleted'
}

export default class FormController {
  constructor(props) {
    this.initialStateTemplateTransformation = props.initialStateTemplateTransformation
    this.onInitialStateLoaded = props.onInitialStateLoaded
    this.formP = props.formP
    this.customComponentFactory = props.customComponentFactory
    this.customPreviewComponentFactory = props.customPreviewComponentFactory
    this.stateLoop = new FormStateLoop(dispatcher, events)
  }

  initialize(formOperations, initialValues, urlContent) {
    return this.stateLoop.initialize(this, formOperations, initialValues, urlContent)
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

  hasPendingChanges(state) {
    return state.saveStatus.changes || state.saveStatus.saveInProgress
  }

  componentOnChangeListener(field, newValue) {
    dispatcher.push(events.updateField, FieldUpdateHandler.createFieldUpdate(field, newValue))
  }

  fileUploadListener(field, files) {
    dispatcher.push(events.startFileUpload, { field: field, files: files })
  }

  deleteAttachment(field) {
    dispatcher.push(events.removeFile, field)
  }

  componentDidMount(field, initialValue) {
    this.initFieldValidation(field, initialValue)
  }

  initFieldValidation(field, value) {
    dispatcher.push(events.fieldValidation, {id: field.id, validationErrors: SyntaxValidator.validateSyntax(field, value)})
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
      throw new Error("To create a custom field, supply customComponentFactory to FormController")
    }
    return this.customComponentFactory.createComponent(componentProps)
  }

  getCustomPreviewComponentTypeMapping() {
    return this.customPreviewComponentFactory ? this.customPreviewComponentFactory.fieldTypeMapping : {}
  }

  createCustomPreviewComponent(componentProps) {
    if (!this.customPreviewComponentFactory) {
      throw new Error("To create a custom field, supply customComponentFactory to FormController")
    }
    return this.customPreviewComponentFactory.createComponent(componentProps)
  }

  getCustomWrapperComponentProperties(state) {
    return this.customComponentFactory ? this.customComponentFactory.getCustomWrapperComponentProperties(state) : {}
  }
}
