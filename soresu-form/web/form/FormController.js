import Dispatcher from '../Dispatcher'

import FieldUpdateHandler from './FieldUpdateHandler.js'
import SyntaxValidator from './SyntaxValidator.js'
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
  startAttachmentUpload: 'startAttachmentUpload',
  attachmentUploadCompleted: 'attachmentUploadCompleted',
  startAttachmentRemoval: 'startAttachmentRemoval',
  attachmentRemovalCompleted: 'attachmentRemovalCompleted',
  refuseApplication: 'refuseApplication',
  onApplicationRefused: 'onApplicationRefused',
  onModifyApplicationContacts: 'onModifyApplicationContacts'
}

export default class FormController {
  constructor(props) {
    this.initialStateTemplateTransformation = props.initialStateTemplateTransformation
    this.onInitialStateLoaded = props.onInitialStateLoaded
    this.formP = props.formP
    this.customComponentFactory = props.customComponentFactory
    this.customPreviewComponentFactory = props.customPreviewComponentFactory
    this.customFieldSyntaxValidator = props.customFieldSyntaxValidator
    this.stateLoop = new FormStateLoop(dispatcher, events)
    this._bind('componentOnChangeListener', 'initFieldValidation', 'getCustomFieldSyntaxValidator')
  }

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this))
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
    dispatcher.push(events.updateField, FieldUpdateHandler.createFieldUpdate(field, newValue, this.customFieldSyntaxValidator))
  }

  createAttachmentDownloadUrl(state, field) {
    const formOperations = state.extensionApi.formOperations
    return formOperations.urlCreator.attachmentDownloadUrl(state, field)
  }

  createOrganisationInfoUrl(state) {
    const formOperations = state.extensionApi.formOperations
    return formOperations.urlCreator.organisationInfoUrl(state)
  }

  uploadAttachment(field, files) {
    dispatcher.push(events.startAttachmentUpload, { field: field, files: files })
  }

  deleteAttachment(field) {
    dispatcher.push(events.startAttachmentRemoval, field)
  }

  componentDidMount(field, initialValue) {
    this.initFieldValidation(field, initialValue)
  }

  initFieldValidation(field, value) {
    dispatcher.push(events.fieldValidation, {id: field.id, validationErrors: SyntaxValidator.validateSyntax(field, value, this.customFieldSyntaxValidator)})
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

  getCustomFieldSyntaxValidator() {
    return this.customFieldSyntaxValidator
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

  getCustomComponentProperties(state) {
    return this.customComponentFactory ? this.customComponentFactory.getCustomComponentProperties(state) : {}
  }

  refuseApplication(comment) {
    dispatcher.push(events.refuseApplication, comment,
                   () => dispatcher.push(events.onApplicationRefused))
  }

  modifyApplicationContacts() {
    dispatcher.push(events.modifyApplicationContacts,
                   () => dispatcher.push(events.onModifyApplicationContacts))
  }
}
