import React from 'react'
import _ from 'lodash'

import FormUtil from 'soresu-form/web/form/FormUtil'
import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import FormPreview from 'soresu-form/web/form/FormPreview.jsx'
import FormStateLoop from 'soresu-form/web/form/FormStateLoop'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator'

import BudgetBusinessRules from './BudgetBusinessRules'
import BudgetEditFormController from './BudgetEditFormController'
import BudgetEditComponentFactory from './BudgetEditComponentFactory'
import BudgetEditPreviewComponentFactory from './BudgetEditPreviewComponentFactory'
import FakeFormState from '../form/FakeFormState'

import style from '../style/budgetedit.less'

export default class HakemusBudgetEditing extends React.Component {
  static isEditingAllowed(allowEditingArvio, formContent, fieldId) {
    if(!allowEditingArvio) {
      return false
    }
    const parentElem = FormUtil.findFieldWithDirectChild(formContent, fieldId)
    const isAmountField = parentElem && parentElem.fieldType === 'vaBudgetItemElement'  && parentElem.children[1].id === fieldId
    return isAmountField ? parentElem.params.incrementsTotal : true
  }

  static validateFields(form, answers, originalHakemus) {
    const budgetItems = FormUtil.findFieldsByFieldType(form.content, 'vaBudgetItemElement')
    budgetItems.map(budgetItem => {
      const amountField = budgetItem.children[1]
      const overriddenValue = InputValueStorage.readValue(form.content, answers, amountField.id)
      const validationErrors = SyntaxValidator.validateSyntax(amountField, overriddenValue)
      if(budgetItem.params.incrementsTotal && _.isEmpty(validationErrors)) {
        const originalValue = InputValueStorage.readValue(form.content, originalHakemus.answers, amountField.id)
        if(parseInt(overriddenValue) > parseInt(originalValue)) {
          validationErrors.push({ error: "oph-sum-bigger-than-original" })
        }
      }
      form.validationErrors = form.validationErrors.merge({[amountField.id]: validationErrors})
    })
  }

  render() {
    const {controller, hakemus, hakuData, avustushaku, translations, allowEditing} = this.props
    const vaBudget = FormUtil.findFieldByFieldType(hakuData.form.content, "vaBudget")

    if (!vaBudget) {
      return null
    }

    const fakeHakemus = {answers: _.get(hakemus, "arvio.overridden-answers", {value: []})}
    const formOperations = {
      chooseInitialLanguage: () => "fi",
      containsExistingEntityId: undefined,
      isFieldEnabled: (saved, fieldId) => HakemusBudgetEditing.isEditingAllowed(allowEditing, vaBudget, fieldId),
      onFieldUpdate: undefined,
      isSaveDraftAllowed: () => allowEditing,
      isNotFirstEdit: () => true,
      createUiStateIdentifier: undefined,
      urlCreator: undefined,
      responseParser: undefined,
      printEntityId: undefined
    }
    const budgetEditFormState = FakeFormState.createHakemusFormState(translations, {form: {content: [vaBudget]}}, fakeHakemus, formOperations, hakemus)
    FormStateLoop.initDefaultValues(
      fakeHakemus.answers,
      BudgetBusinessRules.getInitialValuesByFieldId(budgetEditFormState.form.content, hakemus.answers),
      budgetEditFormState.form.content,
      budgetEditFormState.configuration.lang)
    HakemusBudgetEditing.validateFields(budgetEditFormState.form, fakeHakemus.answers, hakemus)
    const formElementProps = {
      state: budgetEditFormState,
      formContainerClass: allowEditing ? Form : FormPreview,
      infoElementValues: avustushaku,
      controller: new BudgetEditFormController(controller, new BudgetEditComponentFactory(), new BudgetEditPreviewComponentFactory(), avustushaku, budgetEditFormState.form, hakemus),
      containerId: "budget-edit-container",
      headerElements: []
    }
    return (
      <div className="budget-edit">
        <FormContainer {...formElementProps} />
      </div>
    )
  }
}
