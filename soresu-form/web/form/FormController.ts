import { EventStream } from 'baconjs'
import Dispatcher from '../Dispatcher'

import { createFieldUpdate } from './FieldUpdateHandler'
import SyntaxValidator from './SyntaxValidator'
import VaComponentFactory from 'soresu-form/web/va/VaComponentFactory'
import VaPreviewComponentFactory from 'soresu-form/web/va/VaPreviewComponentFactory'
import VaSyntaxValidator from 'soresu-form/web/va/VaSyntaxValidator'
import { BaseStateLoopState, InitialStateTemplate } from 'soresu-form/web/form/types/Form'
import { Field, Form, Language } from 'soresu-form/web/va/types'

export const dispatcher = new Dispatcher()

export const events = {
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
  onModifyApplicationContacts: 'onModifyApplicationContacts',
  modifyApplicationContacts: 'modifyApplicationContacts',
} as const

export type FormEvents = typeof events

interface FormControllerProps<T extends BaseStateLoopState<T>> {
  initialStateTemplateTransformation: (initialState: InitialStateTemplate<T>) => void
  onInitialStateLoaded: (initialState: T) => void
  formP: EventStream<Form>
  customComponentFactory: VaComponentFactory
  customPreviewComponentFactory: VaPreviewComponentFactory
  customFieldSyntaxValidator: typeof VaSyntaxValidator
}

export default class FormController<T extends BaseStateLoopState<T>> {
  initialStateTemplateTransformation: (initialState: InitialStateTemplate<T>) => void
  onInitialStateLoaded: (initialState: T) => void
  formP: EventStream<Form>
  customComponentFactory: VaComponentFactory
  customPreviewComponentFactory: VaPreviewComponentFactory
  customFieldSyntaxValidator: typeof VaSyntaxValidator

  constructor(props: FormControllerProps<T>) {
    this.initialStateTemplateTransformation = props.initialStateTemplateTransformation
    this.onInitialStateLoaded = props.onInitialStateLoaded
    this.formP = props.formP
    this.customComponentFactory = props.customComponentFactory
    this.customPreviewComponentFactory = props.customPreviewComponentFactory
    this.customFieldSyntaxValidator = props.customFieldSyntaxValidator
    this.componentOnChangeListener = this.componentOnChangeListener.bind(this)
    this.initFieldValidation = this.initFieldValidation.bind(this)
    this.getCustomFieldSyntaxValidator = this.getCustomFieldSyntaxValidator.bind(this)
  }

  // Public API
  constructHtmlId(_formContent: any, fieldId: any) {
    return fieldId // For the time being, our field ids are unique within the form
  }

  changeLanguage(lang: Language) {
    dispatcher.push(events.changeLanguage, lang)
  }

  submit(event: any) {
    event.preventDefault()
    dispatcher.push(events.submit, {})
  }

  hasPendingChanges(state: T) {
    return state.saveStatus.changes || state.saveStatus.saveInProgress
  }

  componentOnChangeListener(field: Field, newValue: any) {
    dispatcher.push(
      events.updateField,
      createFieldUpdate(field, newValue, this.customFieldSyntaxValidator)
    )
  }

  createAttachmentDownloadUrl(state: T, field: Field) {
    const formOperations = state.extensionApi.formOperations
    return formOperations.urlCreator.attachmentDownloadUrl(state, field)
  }

  uploadAttachment(field: Field, files: any) {
    dispatcher.push(events.startAttachmentUpload, {
      field: field,
      files: files,
    })
  }

  deleteAttachment(field: Field) {
    dispatcher.push(events.startAttachmentRemoval, field)
  }

  componentDidMount(field: Field, initialValue: any) {
    this.initFieldValidation(field, initialValue)
  }

  initFieldValidation(field: Field, value: any) {
    dispatcher.push(events.fieldValidation, {
      id: field.id,
      validationErrors: SyntaxValidator.validateSyntax(
        field,
        value,
        this.customFieldSyntaxValidator
      ),
    })
  }

  isSaveDraftAllowed(state: T) {
    const formOperations = state.extensionApi.formOperations
    return formOperations.isSaveDraftAllowed(state)
  }

  removeField(field: Field) {
    dispatcher.push(events.removeField, field)
  }

  getCustomComponentTypeMapping() {
    return this.customComponentFactory ? this.customComponentFactory.fieldTypeMapping : {}
  }

  getCustomFieldSyntaxValidator() {
    return this.customFieldSyntaxValidator
  }

  createCustomComponent(componentProps: any) {
    if (!this.customComponentFactory) {
      throw new Error('To create a custom field, supply customComponentFactory to FormController')
    }
    return this.customComponentFactory.createComponent(componentProps)
  }

  getCustomPreviewComponentTypeMapping() {
    return this.customPreviewComponentFactory
      ? this.customPreviewComponentFactory.fieldTypeMapping
      : {}
  }

  createCustomPreviewComponent(componentProps: any) {
    if (!this.customPreviewComponentFactory) {
      throw new Error('To create a custom field, supply customComponentFactory to FormController')
    }
    return this.customPreviewComponentFactory.createComponent(componentProps)
  }

  getCustomComponentProperties(state: T) {
    return this.customComponentFactory
      ? this.customComponentFactory.getCustomComponentProperties(state)
      : {}
  }

  refuseApplication(comment: string) {
    dispatcher.push(events.refuseApplication, comment)
  }
}
