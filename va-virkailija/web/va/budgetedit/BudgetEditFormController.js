import FormUtil from 'soresu-form/web/form/FormUtil'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'

export default class BudgetEditFormController {

  constructor(arviointiController, customComponentFactory, avustushaku, form,  hakemus) {
    this.arviointiController = arviointiController
    this.customComponentFactory = customComponentFactory
    this.avustushaku = avustushaku
    this.form = form
    this.hakemus = hakemus
    this.componentOnChangeListener = this.componentOnChangeListener.bind(this)
    this.copyOriginalValues = this.copyOriginalValues.bind(this)
  }

  constructHtmlId(formContent, fieldId) {
    return "budget-edit-" + fieldId
  }

  getCustomComponentProperties() {
    return { "avustushaku": this.avustushaku,
             "originalHakemus": this.hakemus}
  }

  copyOriginalValues(event) {
    const budgetItems = FormUtil.findFieldsByFieldType(this.form.content, 'vaBudgetItemElement')
    budgetItems.map(budgetItem => this.componentOnChangeListener(budgetItem.children[1], InputValueStorage.readValue(this.form.content, this.hakemus.answers, budgetItem.children[1].id)))
  }

  componentOnChangeListener(field, newValue) {
    this.arviointiController.setHakemusOverrodeAnswerValue(this.hakemus.id, field, newValue)
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

  createAttachmentDownloadUrl(state, field) {
    return "/api/avustushaku/" + this.avustushaku.id + "/hakemus/" + this.hakemus.id + "/attachments/" + field.id
  }

  createAttachmentVersionDownloadUrl(field, attachmentVersion) {
    return "/api/avustushaku/" + this.avustushaku.id + "/hakemus/" + this.hakemus.id + "/attachments/" + field.id + "?attachment-version=" + attachmentVersion
  }
}
