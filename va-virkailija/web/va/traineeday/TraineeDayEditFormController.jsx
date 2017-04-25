export default class TraineeDayEditFormController {
  constructor(arviointiController,
              customComponentFactory,
              avustushaku,
              form,
              hakemus,
              allowEditing) {
    this.arviointiController = arviointiController
    this.customComponentFactory = customComponentFactory
    this.avustushaku = avustushaku
    this.form = form
    this.hakemus = hakemus
    this.componentOnChangeListener = this.componentOnChangeListener.bind(this)
    this.allowEditing = allowEditing
  }

  constructHtmlId(formContent, fieldId) {
    return "trainee-day-edit-" + fieldId
  }

  getCustomComponentProperties() {
    return {
      avustushaku: this.avustushaku,
      originalHakemus: this.hakemus,
      allowEditing: this.allowEditing
    }
  }

  componentOnChangeListener(field, newValue) {
    this.arviointiController.setHakemusOverriddenAnswerValue(this.hakemus.id, field, newValue)
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
