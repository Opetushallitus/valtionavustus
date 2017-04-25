import React from 'react'
import _ from 'lodash'

import JsUtil from 'soresu-form/web/form/JsUtil'
import FormUtil from 'soresu-form/web/form/FormUtil'
import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator'

import BudgetBusinessRules from './BudgetBusinessRules'
import BudgetEditFormController from './BudgetEditFormController'
import BudgetEditComponentFactory from './BudgetEditComponentFactory'
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

    const fakeHakemus = {
      "answers": hakemus.arvio["overridden-answers"],
      "budget-oph-share": hakemus["budget-oph-share"],
      "budget-total": hakemus["budget-total"]
    }
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
    const budgetEditFormState = FakeFormState.createHakemusFormState({
      translations,
      avustushaku,
      formContent: [vaBudget],
      formOperations,
      hakemus: fakeHakemus,
      savedHakemus: hakemus
    })
    HakemusBudgetEditing.validateFields(budgetEditFormState.form, fakeHakemus.answers, hakemus)
    const formElementProps = {
      state: budgetEditFormState,
      formContainerClass: Form,
      infoElementValues: avustushaku,
      controller: new BudgetEditFormController(controller, new BudgetEditComponentFactory(), avustushaku, budgetEditFormState.form, hakemus),
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
