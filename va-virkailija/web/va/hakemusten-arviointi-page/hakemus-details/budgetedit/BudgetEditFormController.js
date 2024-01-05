import _ from 'lodash'

import FormUtil from 'soresu-form/web/form/FormUtil'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'

import BudgetBusinessRules from './BudgetBusinessRules'
import { isMoneyField, isValidMoney } from 'soresu-form/web/form/MoneyValidator'

export default class BudgetEditFormController {
  constructor(
    onAnswerOverride,
    onDetailedCostsToggle,
    onCostsGranted,
    customComponentFactory,
    avustushaku,
    form,
    hakemus,
    helpTexts
  ) {
    this.onAnswerOverride = onAnswerOverride
    this.onDetailedCostsToggle = onDetailedCostsToggle
    this.onCostsGranted = onCostsGranted
    this.customComponentFactory = customComponentFactory
    this.avustushaku = avustushaku
    this.form = form
    this.hakemus = hakemus
    this.budgetBusinessRules = new BudgetBusinessRules(form.content[0], hakemus.arvio)
    this.helpTexts = helpTexts
    this.componentOnChangeListener = this.componentOnChangeListener.bind(this)
    this.copyOriginalValues = this.copyOriginalValues.bind(this)
    this.toggleDetailedCostsListener = this.toggleDetailedCostsListener.bind(this)
    this.costsGrantedOnChangeListener = this.costsGrantedOnChangeListener.bind(this)
  }

  constructHtmlId(formContent, fieldId) {
    return 'budget-edit-' + fieldId
  }

  getCustomComponentProperties() {
    return {
      avustushaku: this.avustushaku,
      originalHakemus: this.hakemus,
      helpTexts: this.helpTexts,
    }
  }

  copyOriginalValues() {
    const budgetItems = FormUtil.findFieldsByFieldType(this.form.content, 'vaBudgetItemElement')
    budgetItems.map((budgetItem) =>
      this.componentOnChangeListener(
        budgetItem.children[1],
        InputValueStorage.readValue(
          this.form.content,
          this.hakemus.answers,
          budgetItem.children[1].id
        )
      )
    )
  }

  componentOnChangeListener(field, newValue) {
    if (!isMoneyField(field)) {
      this.overrideAnswerValue(field, newValue)
    } else {
      const valueOrZero = Boolean(newValue) ? newValue : 0
      if (isValidMoney(valueOrZero)) {
        this.overrideAnswerValue(field, parseInt(valueOrZero, 10))
      }
    }
  }

  overrideAnswerValue(field, newValue) {
    this.onAnswerOverride(this.hakemus, field, newValue)
  }

  toggleDetailedCostsListener(event) {
    const answers = this.hakemus.arvio['overridden-answers']
    const formContent = this.form.content
    const findCost = (budgetItem) =>
      Number(InputValueStorage.readValue(formContent, answers, budgetItem.children[1].id))
    const budgetItemsAmounts = FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
      .filter((budgetItem) => budgetItem.params.incrementsTotal)
      .map(findCost)
    const useDetailedCosts = event.target.value === 'true'
    if (_.sum(budgetItemsAmounts) === 0) {
      this.copyOriginalValues()
    }
    this.onDetailedCostsToggle(this.hakemus.id, useDetailedCosts)
    /*this.arviointiController.toggleDetailedCosts(
      this.hakemus,
      useDetailedCosts
    );*/
  }

  costsGrantedOnChangeListener(event) {
    const newValue = Number(event.target.value.replace(/\s+/, ''))
    if (!isNaN(newValue)) {
      this.onCostsGranted(this.hakemus.id, newValue)
      // this.arviointiController.setCostsGrantedValue(this.hakemus, newValue);
    }
  }

  componentDidMount() {}

  initFieldValidation() {}

  isSaveDraftAllowed() {
    return true
  }

  getCustomComponentTypeMapping() {
    return this.customComponentFactory ? this.customComponentFactory.fieldTypeMapping : {}
  }

  createCustomComponent(componentProps) {
    if (!this.customComponentFactory) {
      throw new Error('To create a custom field, supply customComponentFactory to FormController')
    }
    return this.customComponentFactory.createComponent(componentProps)
  }

  createAttachmentDownloadUrl(state, field) {
    return `/api/avustushaku/${this.avustushaku.id}/hakemus/${this.hakemus.id}/attachments/${field.id}`
  }

  createAttachmentVersionDownloadUrl(field, attachmentVersion) {
    return `/api/avustushaku/${this.avustushaku.id}/hakemus/${this.hakemus.id}/attachments/${field.id}?attachment-version=${attachmentVersion}`
  }
}
