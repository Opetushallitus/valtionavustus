import React, { Component } from 'react'

import FormUtil from 'soresu-form/web/form/FormUtil'
import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import FormPreview from 'soresu-form/web/form/FormPreview.jsx'
import FormStateLoop from 'soresu-form/web/form/FormStateLoop'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator'

import BudgetEditFormController from './BudgetEditFormController.js'
import BudgetEditComponentFactory from './BudgetEditComponentFactory.js'
import BudgetEditPreviewComponentFactory from './BudgetEditPreviewComponentFactory'
import FakeFormState from '../form/FakeFormState.js'

import style from '../style/budgetedit.less'

export default class HakemusBudgetEditing extends Component {

  static initialValues(formContent, originalHakemus) {
    const budgetItems =  FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
    const initialValues = {}
    budgetItems.map(budgetItem => initialValues[budgetItem.children[0].id] = "")
    budgetItems.filter(budgetItem => budgetItem.params.incrementsTotal === false)
        .map(budgetItem => initialValues[budgetItem.children[1].id] = InputValueStorage.readValue(formContent, originalHakemus.answers, budgetItem.children[1].id))
    return initialValues
  }

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
    budgetItems.map(function(budgetItem) {
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
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const hakuData = this.props.hakuData
    const avustushaku = this.props.avustushaku
    const translations = this.props.translations
    const allowEditing = this.props.allowEditing
    const vaBudget = FormUtil.findFieldsByFieldType(hakuData.form.content, "vaBudget")
    const fakeHakemus = {answers: _.get(hakemus, "arvio.overridden-answers", {value: []})}
    const formOperations = {
      chooseInitialLanguage: function() {return "fi"},
      containsExistingEntityId: undefined,
      isFieldEnabled: function(saved, fieldId) {return HakemusBudgetEditing.isEditingAllowed(allowEditing, vaBudget, fieldId)},
      onFieldUpdate: undefined,
      isSaveDraftAllowed: function() {return allowEditing},
      isNotFirstEdit: function() {return true},
      createUiStateIdentifier: undefined,
      urlCreator: undefined,
      responseParser: undefined,
      printEntityId: undefined
    }
    const budgetEditFormState = FakeFormState.createHakemusFormState(translations, {form: {content: vaBudget}}, fakeHakemus, formOperations, hakemus)
    FormStateLoop.initDefaultValues(fakeHakemus.answers, HakemusBudgetEditing.initialValues(budgetEditFormState.form.content, hakemus), budgetEditFormState.form.content, budgetEditFormState.configuration.lang)
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

