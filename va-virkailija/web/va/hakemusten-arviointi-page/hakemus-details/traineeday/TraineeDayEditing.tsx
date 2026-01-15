import './traineeday.css'

import _ from 'lodash'
import React from 'react'

import FormContainer from 'soresu-form/web/form/FormContainer'
import Form from 'soresu-form/web/form/Form.jsx'

import VaTraineeDayUtil from 'soresu-form/web/va/VaTraineeDayUtil'

import FakeFormState from '../../../form/FakeFormState'
import TraineeDayEditFormController from './TraineeDayEditFormController.jsx'
import TraineeDayEditComponentFactory from './TraineeDayEditComponentFactory'

import { Field, Hakemus } from 'soresu-form/web/va/types'
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from '../../arviointiStore'
import {
  getLoadedAvustushakuData,
  setArvioFieldValue,
  startHakemusArvioAutoSave,
} from '../../arviointiReducer'
import { createFieldUpdate } from 'soresu-form/web/form/FieldUpdateHandler'
import VaSyntaxValidator from 'soresu-form/web/va/VaSyntaxValidator'

interface Props {
  hakemus: Hakemus
  allowEditing: boolean | undefined
}

const TraineeDayEditing = ({ hakemus, allowEditing }: Props) => {
  const dispatch = useHakemustenArviointiDispatch()
  const { hakuData } = useHakemustenArviointiSelector((state) =>
    getLoadedAvustushakuData(state.arviointi)
  )
  const { avustushaku } = hakuData
  const traineeDayCalcs = VaTraineeDayUtil.collectCalculatorSpecifications(
    hakuData.form.content,
    hakemus.answers
  )

  if (_.isEmpty(traineeDayCalcs)) {
    return null
  }
  const onChange = (hakemus: Hakemus, field: Field, newValue: any) => {
    const overriddenAnswers = hakemus.arvio['overridden-answers']?.value ?? []
    const fieldUpdate = createFieldUpdate(field, newValue, VaSyntaxValidator)
    const index = overriddenAnswers.findIndex((a) => a.key === fieldUpdate.id)
    const answer = {
      ...overriddenAnswers[index],
      value: fieldUpdate.value,
    }
    if (index !== -1) {
      dispatch(
        setArvioFieldValue({
          hakemusId: hakemus.id,
          answer,
          index,
        })
      )
      dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }))
    }
  }
  const formOperations = {
    chooseInitialLanguage: () => 'fi',
    containsExistingEntityId: undefined,
    isFieldEnabled: (_fieldId: string) => allowEditing,
    onFieldUpdate: undefined,
    isSaveDraftAllowed: function () {
      return allowEditing
    },
    isNotFirstEdit: function () {
      return true
    },
    createUiStateIdentifier: undefined,
    urlCreator: undefined,
    responseParser: undefined,
    printEntityId: undefined,
  }
  const fakeHakemus = {
    ..._.cloneDeep(hakemus),
    ...{
      answers: _.cloneDeep(hakemus.arvio['overridden-answers']?.value ?? []),
    },
  }
  const traineeDayEditFormState = FakeFormState.createHakemusFormState({
    avustushaku,
    formContent: [
      {
        fieldType: 'vaTraineeDayCalculatorSummary',
        fieldClass: 'wrapperElement',
        id: 'trainee-day-summary',
        children: traineeDayCalcs,
      },
    ],
    formOperations,
    hakemus: fakeHakemus,
    savedHakemus: hakemus,
  })
  const formElementProps = {
    state: traineeDayEditFormState,
    form: Form,
    infoElementValues: avustushaku,
    controller: new TraineeDayEditFormController(
      onChange,
      new TraineeDayEditComponentFactory(),
      avustushaku,
      traineeDayEditFormState.form,
      hakemus,
      allowEditing
    ),
    containerId: 'trainee-day-edit-container',
    headerElements: [],
  }

  return (
    <div className="trainee-day-edit">
      <FormContainer {...formElementProps} />
    </div>
  )
}

export default TraineeDayEditing
