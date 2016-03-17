import FormUtil from 'soresu-form/web/form/FormUtil'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'

export default class BudgetEditFormController {

  constructor(arviointiController, customComponentFactory, customPreviewComponentFactory, avustushaku, form,  hakemus) {
    this.arviointiController = arviointiController
    this.customComponentFactory = customComponentFactory
    this.customPreviewComponentFactory = customPreviewComponentFactory
    this.avustushaku = avustushaku
    this.form = form
    this.hakemus = hakemus
    this.componentOnChangeListener = this.componentOnChangeListener.bind(this)
    this.copyOriginalValues = this.copyOriginalValues.bind(this)
    this.toggleDetailedCostsListener = this.toggleDetailedCostsListener.bind(this)
    this.costsGrantedOnChangeListener = this.costsGrantedOnChangeListener.bind(this)
  }

  constructHtmlId(formContent, fieldId) {
    return "budget-edit-" + fieldId
  }

  getCustomComponentProperties() {
    return {avustushaku: this.avustushaku,
            originalHakemus: this.hakemus}
  }

  copyOriginalValues(event) {
    const budgetItems = FormUtil.findFieldsByFieldType(this.form.content, 'vaBudgetItemElement')
    budgetItems.map(budgetItem => this.componentOnChangeListener(budgetItem.children[1], InputValueStorage.readValue(this.form.content, this.hakemus.answers, budgetItem.children[1].id)))
  }

  componentOnChangeListener(field, newValue) {
    this.arviointiController.setHakemusOverriddenAnswerValue(this.hakemus.id, field, newValue)
  }

  toggleDetailedCostsListener(event) {
    this.arviointiController.toggleDetailedCosts(this.hakemus, event.target.value === 'true')
  }

  costsGrantedOnChangeListener(event) {
    this.arviointiController.setCostsGrantedValue(this.hakemus, Number(event.target.value))
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
    return "/api/avustushaku/" + this.avustushaku.id + "/hakemus/" + this.hakemus.id + "/attachments/" + field.id
  }

  createAttachmentVersionDownloadUrl(field, attachmentVersion) {
    return "/api/avustushaku/" + this.avustushaku.id + "/hakemus/" + this.hakemus.id + "/attachments/" + field.id + "?attachment-version=" + attachmentVersion
  }
}
