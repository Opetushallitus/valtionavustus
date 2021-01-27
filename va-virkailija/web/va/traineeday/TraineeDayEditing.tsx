import _ from 'lodash'
import React from 'react'

import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'

import VaTraineeDayUtil from 'va-common/web/va/VaTraineeDayUtil'

import FakeFormState from '../form/FakeFormState'
import TraineeDayEditFormController from './TraineeDayEditFormController.jsx'
import TraineeDayEditComponentFactory from './TraineeDayEditComponentFactory'

import '../style/traineeday.less'

import { FormikHook } from 'va-common/web/va/standardized-form-fields/types'

interface TraineeDayEditingProps {
  controller: any
  avustushaku: any
  hakuData: any
  hakemus: any
  translations: any
  allowEditing: any
  environment: any
  f: FormikHook
}

export const TraineeDayEditing = ({controller, avustushaku, hakuData, hakemus, translations, allowEditing, environment, f}: TraineeDayEditingProps) => {
    const traineeDayCalcs = VaTraineeDayUtil.collectCalculatorSpecifications(hakuData.form.content, hakemus.answers)

    if (_.isEmpty(traineeDayCalcs)) {
      return null
    }

    const formOperations = {
      chooseInitialLanguage: () => "fi",
      containsExistingEntityId: undefined,
      isFieldEnabled: function() {return allowEditing},
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
        children:   traineeDayCalcs
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
      headerElements: [],
      f,
      environment
    }

    return (
      <div className="trainee-day-edit">
        <FormContainer {...formElementProps} />
      </div>
    )
  }
