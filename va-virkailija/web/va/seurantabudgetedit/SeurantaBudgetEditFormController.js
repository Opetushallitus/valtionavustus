import FormUtil from 'soresu-form/web/form/FormUtil'

import BudgetBusinessRules from '../budgetedit/BudgetBusinessRules.js'

export default class SeurantaBudgetEditFormController {
  constructor(arviointiController,
              customComponentFactory,
              customPreviewComponentFactory,
              avustushaku,
              form,
              hakemus) {
    this.arviointiController = arviointiController
    this.customComponentFactory = customComponentFactory
    this.customPreviewComponentFactory = customPreviewComponentFactory
    this.avustushaku = avustushaku
    this.budgetBusinessRules = new BudgetBusinessRules(form.content[0], hakemus.arvio)
    this.hakemus = hakemus
    this.componentOnChangeListener = this.componentOnChangeListener.bind(this)
  }

  constructHtmlId(formContent, fieldId) {
    return "budget-edit-" + fieldId
  }

  getCustomComponentProperties() {
    return {avustushaku: this.avustushaku,
            originalHakemus: this.hakemus}
  }

  componentOnChangeListener(field, newValue) {
    this.arviointiController.setHakemusSeurantaAnswerValue(this.hakemus.id, field, newValue)
  }

  componentDidMount(field, initialValue) {
  }

  initFieldValidation(field, value) {
  }

  isSaveDraftAllowed(state) {
    return true
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
    return this.customPreviewComponentFactory.fieldTypeMapping
  }

  createCustomPreviewComponent(componentProps) {
    return this.customPreviewComponentFactory.createComponent(componentProps)
  }

  createAttachmentDownloadUrl(state, field) {
    return `/api/avustushaku/${this.avustushaku.id}/hakemus/${this.hakemus.id}/attachments/${field.id}`
  }

  createAttachmentVersionDownloadUrl(field, attachmentVersion) {
    return `/api/avustushaku/${this.avustushaku.id}/hakemus/${this.hakemus.id}/attachments/${field.id}?attachment-version=${attachmentVersion}`
  }
}
