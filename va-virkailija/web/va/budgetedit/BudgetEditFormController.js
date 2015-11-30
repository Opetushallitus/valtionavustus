
export default class BudgetEditFormController {

  constructor(customComponentFactory, avustushaku, hakemus) {
    this.customComponentFactory = customComponentFactory
    this.avustushaku = avustushaku
    this.hakemus = hakemus
  }

  constructHtmlId(formContent, fieldId) {
    return "budget-edit-" + fieldId
  }

  getCustomComponentProperties() {
    return { "avustushaku": this.avustushaku }
  }

  componentOnChangeListener(field, newValue) {
    console.log(field, newValue)
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
