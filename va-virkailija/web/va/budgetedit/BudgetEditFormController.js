
export default class BudgetEditFormController {

  constructor(arviointiController, customComponentFactory, avustushaku, hakemus) {
    this.arviointiController = arviointiController
    this.customComponentFactory = customComponentFactory
    this.avustushaku = avustushaku
    this.hakemus = hakemus
    this.componentOnChangeListener = this.componentOnChangeListener.bind(this)
  }

  constructHtmlId(formContent, fieldId) {
    return "budget-edit-" + fieldId
  }

  getCustomComponentProperties() {
    return { "avustushaku": this.avustushaku,
             "originalHakemus": this.hakemus}
  }

  copyOriginalValues(event) {
    console.log("TODO copyOriginalValues:", event)
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
