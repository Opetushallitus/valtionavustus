import '../../../../style/budgetedit.css'

import React from 'react'
import _ from 'lodash'

import FormUtil from 'soresu-form/web/form/FormUtil'
import FormContainer from 'soresu-form/web/form/FormContainer'
import Form from 'soresu-form/web/form/Form.jsx'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator'
import { Answer, Avustushaku, Hakemus, Form as FormType, Field } from 'soresu-form/web/va/types'

import { BudgetTable } from './BudgetTable'
import FakeFormState from '../../../../form/FakeFormState'
import SeurantaBudgetEditFormController from './SeurantaBudgetEditFormController'
import SeurantaBudgetEditComponentFactory from './SeurantaBudgetEditComponentFactory'

import { HakuData } from '../../../../types'
import { Muutoshakemus } from 'soresu-form/web/va/types/muutoshakemus'
import { createFieldUpdate } from 'soresu-form/web/form/FieldUpdateHandler'
import VaSyntaxValidator from 'soresu-form/web/va/VaSyntaxValidator'
import { useHakemustenArviointiDispatch } from '../../../arviointiStore'
import { setArvioValue, startHakemusArvioAutoSave } from '../../../arviointiReducer'

interface SeurantaBudgetEditingProps {
  hakemus: Hakemus
  hakuData: HakuData
  avustushaku: Avustushaku
  muutoshakemukset?: Muutoshakemus[]
}

const SeurantaBudgetEditing = ({
  hakemus,
  hakuData,
  avustushaku,
  muutoshakemukset,
}: SeurantaBudgetEditingProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  const onChangeListener = (hakemus: Hakemus, field: Field, newValue: any) => {
    const clonedHakemus = _.cloneDeep(hakemus)
    const key = 'seuranta-answers' as const
    InputValueStorage.writeValue(
      [field],
      clonedHakemus.arvio[key],
      createFieldUpdate(field, newValue, VaSyntaxValidator)
    )
    dispatch(
      setArvioValue({
        hakemusId: clonedHakemus.id,
        key,
        value: clonedHakemus.arvio['seuranta-answers'],
      })
    )
    dispatch(startHakemusArvioAutoSave({ hakemusId: clonedHakemus.id }))
  }
  const validateFields = (form: FormType, answers?: Answer[]) => {
    const budgetItems = FormUtil.findFieldsByFieldType(form.content, 'vaBudgetItemElement')
    budgetItems.map((budgetItem) => {
      const amountField = budgetItem.children?.[1]
      if (amountField) {
        const overriddenValue = InputValueStorage.readValue(form.content, answers, amountField.id)
        const validationErrors = SyntaxValidator.validateSyntax(amountField, overriddenValue)
        form.validationErrors = form.validationErrors.merge({
          [amountField.id]: validationErrors,
        })
      }
    })
  }

  const vaBudget = FormUtil.findFieldByFieldType(hakuData.form.content, 'vaBudget')

  if (!vaBudget) {
    return null
  }

  const budgetSpecWithSelvityses = FormUtil.mergeDeepFieldTrees(
    vaBudget,
    FormUtil.findFieldByFieldType(hakemus?.selvitys?.valiselvitysForm?.content ?? [], 'vaBudget') ??
      {},
    FormUtil.findFieldByFieldType(
      hakemus?.selvitys?.loppuselvitysForm?.content ?? [],
      'vaBudget'
    ) ?? {}
  )

  const budgetChangeEnabled = Array.isArray(hakemus.normalizedData?.talousarvio)
  const budgetSpec = budgetChangeEnabled
    ? {
        ...budgetSpecWithSelvityses,
        children: budgetSpecWithSelvityses.children?.filter((c) => c.id !== 'project-budget'),
      }
    : budgetSpecWithSelvityses
  const fakeHakemus = {
    answers: hakemus.arvio['seuranta-answers'],
  } as unknown as Hakemus
  const formOperations = {
    chooseInitialLanguage: () => 'fi',
    containsExistingEntityId: undefined,
    onFieldUpdate: undefined,
    isSaveDraftAllowed: () => true,
    isNotFirstEdit: () => true,
    createUiStateIdentifier: undefined,
    urlCreator: undefined,
    responseParser: undefined,
    printEntityId: undefined,
  }
  const budgetEditFormState = FakeFormState.createHakemusFormState({
    avustushaku,
    formContent: [budgetSpec],
    formOperations,
    hakemus: fakeHakemus,
    savedHakemus: hakemus,
  })
  validateFields(budgetEditFormState.form, fakeHakemus.answers)
  const formElementProps = {
    state: budgetEditFormState,
    form: Form,
    infoElementValues: avustushaku,
    controller: new SeurantaBudgetEditFormController(
      onChangeListener,
      new SeurantaBudgetEditComponentFactory(),
      avustushaku,
      budgetEditFormState.form,
      hakemus
    ),
    containerId: 'budget-edit-container',
    headerElements: [],
  }
  return (
    <div className="budget-edit">
      <h2>Budjetti</h2>
      {budgetChangeEnabled && muutoshakemukset && (
        <BudgetTable muutoshakemukset={muutoshakemukset} hakemus={hakemus} hakuData={hakuData} />
      )}
      <FormContainer {...formElementProps} />
    </div>
  )
}

export default SeurantaBudgetEditing
