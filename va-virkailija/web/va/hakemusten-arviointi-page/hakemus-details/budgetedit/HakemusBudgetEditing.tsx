import React from 'react'
import _ from 'lodash'

import FormUtil from 'soresu-form/web/form/FormUtil'
import FormContainer from 'soresu-form/web/form/FormContainer'
import Form from 'soresu-form/web/form/Form.jsx'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator'

import BudgetEditFormController from './BudgetEditFormController'
import BudgetEditComponentFactory from './BudgetEditComponentFactory'
import FakeFormState from '../../../form/FakeFormState'

import '../../../style/budgetedit.css'
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from '../../arviointiStore'
import { Answer, Field, Hakemus } from 'soresu-form/web/va/types'
import {
  getLoadedAvustushakuData,
  saveHakemusArvio,
  setArvioFieldValue,
  setArvioValue,
  startHakemusArvioAutoSave,
} from '../../arviointiReducer'
import { createFieldUpdate } from 'soresu-form/web/form/FieldUpdateHandler'
import VaSyntaxValidator from 'soresu-form/web/va/VaSyntaxValidator'
import { useHelpTexts } from '../../../initial-data-context'

interface Props {
  hakemus: Hakemus
  allowEditing: boolean | undefined
}

const HakemusBudgetEditing = ({ allowEditing, hakemus }: Props) => {
  const helpTexts = useHelpTexts()
  const { hakuData } = useHakemustenArviointiSelector((state) =>
    getLoadedAvustushakuData(state.arviointi)
  )
  const { avustushaku } = hakuData
  const dispatch = useHakemustenArviointiDispatch()
  const isEditingAllowed = (
    allowEditingArvio: boolean | undefined,
    formContent: Field,
    fieldId: string
  ) => {
    if (!allowEditingArvio) {
      return false
    }
    const parentElem = FormUtil.findFieldWithDirectChild(formContent, fieldId)
    const isAmountField =
      parentElem &&
      parentElem.fieldType === 'vaBudgetItemElement' &&
      parentElem.children?.[1]?.id === fieldId
    return isAmountField ? parentElem.params.incrementsTotal : true
  }

  const onAnswerOverride = (hakemus: Hakemus, field: Field, newValue: any) => {
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

  const onDetailedCostsToggle = (hakemusId: number, value: boolean) => {
    dispatch(
      setArvioValue({
        hakemusId,
        key: 'useDetailedCosts',
        value,
      })
    )
    dispatch(saveHakemusArvio({ hakemusId }))
  }

  const onCostsGranted = (hakemusId: number, value: number) => {
    dispatch(
      setArvioValue({
        hakemusId,
        key: 'costsGranted',
        value,
      })
    )
    dispatch(startHakemusArvioAutoSave({ hakemusId }))
  }

  const validateFields = (form: any, answers: Answer[], originalHakemus: Hakemus) => {
    const budgetItems = FormUtil.findFieldsByFieldType(form.content, 'vaBudgetItemElement')
    budgetItems.map((budgetItem) => {
      const amountField = budgetItem.children[1]
      const overriddenValue = InputValueStorage.readValue(form.content, answers, amountField.id)
      const validationErrors = SyntaxValidator.validateSyntax(amountField, overriddenValue)
      if (budgetItem.params.incrementsTotal && _.isEmpty(validationErrors)) {
        const originalValue = InputValueStorage.readValue(
          form.content,
          originalHakemus.answers,
          amountField.id
        )
        if (parseInt(overriddenValue) > parseInt(originalValue)) {
          validationErrors.push({ error: 'oph-sum-bigger-than-original' })
        }
      }
      form.validationErrors = form.validationErrors.merge({
        [amountField.id]: validationErrors,
      })
    })
  }

  const vaBudget = FormUtil.findFieldByFieldType(hakuData.form.content, 'vaBudget')

  if (!vaBudget) {
    return null
  }

  const fakeHakemus = {
    ..._.cloneDeep(hakemus),
    ...{
      answers: hakemus.arvio['overridden-answers']?.value ?? [],
      'budget-oph-share': hakemus['budget-oph-share'],
      'budget-total': hakemus['budget-total'],
    },
  }
  const formOperations = {
    chooseInitialLanguage: () => 'fi',
    containsExistingEntityId: undefined,
    isFieldEnabled: (fieldId: string) => isEditingAllowed(allowEditing, vaBudget, fieldId),
    onFieldUpdate: undefined,
    isSaveDraftAllowed: () => allowEditing,
    isNotFirstEdit: () => true,
    createUiStateIdentifier: undefined,
    urlCreator: undefined,
    responseParser: undefined,
    printEntityId: undefined,
  }
  const budgetEditFormState = FakeFormState.createHakemusFormState({
    avustushaku,
    formContent: [vaBudget],
    formOperations,
    hakemus: fakeHakemus,
    savedHakemus: hakemus,
  })
  validateFields(budgetEditFormState.form, fakeHakemus.answers, hakemus)
  const formElementProps = {
    state: budgetEditFormState,
    form: Form,
    infoElementValues: avustushaku,
    controller: new BudgetEditFormController(
      onAnswerOverride,
      onDetailedCostsToggle,
      onCostsGranted,
      new BudgetEditComponentFactory(),
      avustushaku,
      budgetEditFormState.form,
      hakemus,
      helpTexts
    ),
    containerId: 'budget-edit-container',
    headerElements: [],
  }
  return (
    <div className="budget-edit">
      <FormContainer {...formElementProps} />
    </div>
  )
}

export default HakemusBudgetEditing
