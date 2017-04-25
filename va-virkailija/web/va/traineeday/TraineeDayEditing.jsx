import React, { Component } from 'react'
import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import FormStateLoop from 'soresu-form/web/form/FormStateLoop'
import FormUtil from 'soresu-form/web/form/FormUtil'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import FakeFormState from '../form/FakeFormState.js'
import TraineeDayEditFormController from './TraineeDayEditFormController.jsx'
import TraineeDayEditComponentFactory from './TraineeDayEditComponentFactory.jsx'
import Koulutusosiot from './Koulutusosiot'
import _ from 'lodash'
import style from '../style/traineeday.less'

export default class TraineeDayEditing extends Component {

  static initialValues(formContent, originalHakemus) {
    const traineeItems =  FormUtil.findFieldsByFieldType(formContent, 'vaTraineeDayCalculator')
    const initialValues = {}
    traineeItems.map(item => initialValues[item.id] = "")
    traineeItems
      .map(item => {
        const koulutusosio = Koulutusosiot.values(originalHakemus.answers,item.id)
        return initialValues[item.id] = _.cloneDeep(Koulutusosiot.traineeDayCalculator(koulutusosio))
        }
      )
    return initialValues
  }

  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const hakuData = this.props.hakuData
    const hakemus = this.props.hakemus
    const translations = this.props.translations
    const allowEditing = this.props.allowEditing
    const traineeDayCalculatorsAll = FormUtil.findFieldsByFieldType(hakuData.form.content, "vaTraineeDayCalculator")
    const traineeDayCalculatorAnswers = InputValueStorage.readValues(hakemus.answers, "vaTraineeDayCalculator")
    const keys = _.pluck(traineeDayCalculatorAnswers,'key')
    const traineeDayCalculators = keys.map(key =>{
        var calculator = _.clone(traineeDayCalculatorsAll[0])
        calculator.id = key
        return calculator
      }
    )
    if(traineeDayCalculators.length==0){
      return null
    }
    const formOperations = {
      chooseInitialLanguage: function() {return "fi"},
      containsExistingEntityId: undefined,
      isFieldEnabled: function(saved, fieldId) {return allowEditing},
      onFieldUpdate: undefined,
      isSaveDraftAllowed: function() {return allowEditing},
      isNotFirstEdit: function() {return true},
      createUiStateIdentifier: undefined,
      urlCreator: undefined,
      responseParser: undefined,
      printEntityId: undefined
    }
    const fakeHakemus = {answers: hakemus.arvio["overridden-answers"]}
    const traineeDayEditFormState = FakeFormState.createHakemusFormState({
      translations,
      avustushaku,
      formContent: [{
        fieldType:  "vaTraineeDayCalculatorSummary",
        fieldClass: "wrapperElement",
        id:         "trainee-day-summary",
        children:   traineeDayCalculators
      }],
      formOperations,
      hakemus: fakeHakemus,
      savedHakemus: hakemus
    })
    const formElementProps = {
      state: traineeDayEditFormState,
      formContainerClass: Form,
      infoElementValues: avustushaku,
      controller: new TraineeDayEditFormController(controller, new TraineeDayEditComponentFactory(), avustushaku, traineeDayEditFormState.form, hakemus, allowEditing),
      containerId: "trainee-day-edit-container",
      headerElements: []
    }

    return (
      <div className="trainee-day-edit">
        <FormContainer {...formElementProps} />
      </div>
    )
  }
}
