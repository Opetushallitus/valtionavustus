import React, { Component } from 'react'

import FormUtil from 'soresu-form/web/form/FormUtil'
import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import FormStateLoop from 'soresu-form/web/form/FormStateLoop'

import BudgetEditFormController from './BudgetEditFormController.js'
import BudgetEditComponentFactory from './BudgetEditComponentFactory.js'
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
    const budgetEditFormState = FakeFormState.createHakemusFormState(translations, {form: {content: vaBudget}}, fakeHakemus, formOperations, hakemus)
    FormStateLoop.initDefaultValues(fakeHakemus.answers, {}, budgetEditFormState.form.content, budgetEditFormState.configuration.lang)
    const formElementProps = {
      state: budgetEditFormState,
      formContainerClass: Form,
      infoElementValues: avustushaku,
      controller: new BudgetEditFormController(controller, new BudgetEditComponentFactory(), avustushaku, hakemus),
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

export class BudgetGranted extends React.Component {
  render() {
    const hakemus = this.props.hakemus
    const arvio = hakemus.arvio
    const budgetGranted = _.get(arvio, "budget-granted", 0)

    return <div className="value-edit budget-granted">
      <label htmlFor="budget-granted">Myönnettevä avustus <span id="budget-granted">{budgetGranted}</span> €</label>
    </div>
  }
}

