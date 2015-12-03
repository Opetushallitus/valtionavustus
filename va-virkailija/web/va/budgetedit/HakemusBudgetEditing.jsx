import React, { Component } from 'react'

import FormUtil from 'soresu-form/web/form/FormUtil'
import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'

import VaBudgetElement from 'va-common/web/va/VaBudgetComponents.jsx'
import VaComponentFactory from 'va-common/web/va/VaComponentFactory.js'

import BudgetEditFormController from './BudgetEditFormController.js'
import FakeFormState from '../form/FakeFormState.js'

import style from '../style/budgetedit.less'

export default class HakemusBudgetEditing extends Component {
  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const hakuData = this.props.hakuData
    const avustushaku = this.props.avustushaku
    const translations = this.props.translations
    const allowEditing = this.props.allowEditing
    const vaBudget = FormUtil.findFieldsByFieldType(hakuData.form.content, "vaBudget")
    const fakeHakemus = {answers: hakemus.arvio ? hakemus.arvio["overrode-answers"] : {value: []}}
    const formOperations = {
      chooseInitialLanguage: function() {return "fi"},
      containsExistingEntityId: undefined,
      isFieldEnabled: function() {return allowEditing},
      onFieldUpdate: undefined,
      isSaveDraftAllowed: function() {return true},
      isNotFirstEdit: function() {return true},
      createUiStateIdentifier: undefined,
      urlCreator: undefined,
      responseParser: undefined,
      printEntityId: undefined
    }
    const budgetEditFormState = FakeFormState.createHakemusFormState(translations, {form: {content: vaBudget}}, fakeHakemus, formOperations)
    const formElementProps = {
      state: budgetEditFormState,
      formContainerClass: Form,
      infoElementValues: avustushaku,
      controller: new BudgetEditFormController(controller, new VaComponentFactory(), avustushaku, hakemus.id),
      containerId: "budget-edit-container",
      headerElements: []
    }
    return (
      <div className="budget-edit">
        <BudgetGranted controller={controller} hakemus={hakemus} allowEditing={allowEditing} />
        <FormContainer {...formElementProps} />
      </div>
    )
  }
}

class BudgetGranted extends React.Component {
  render() {
    const hakemus = this.props.hakemus
    const arvio = hakemus.arvio
    const allowEditing = this.props.allowEditing
    const budgetGranted = _.get(arvio, "budget-granted", 0)
    const controller = this.props.controller
    const onChange = e => {
      const inputValue = e.target.value
      const inputValueWithNumericInput = inputValue ? inputValue.replace(/\D/g,'') : "0"
      const number = FormUtil.isNumeric(inputValueWithNumericInput) ? parseInt(inputValueWithNumericInput) : 0
      controller.setHakemusArvioBudgetGranted(hakemus, number)
    }

    return <div className="value-edit budget-granted">
      <label htmlFor="budget-granted">Myönnetty avustus</label>
      <input id="budget-granted" disabled={!allowEditing} type="text" value={budgetGranted} onChange={onChange} maxLength="9" size="9"/> €
    </div>
  }
}

