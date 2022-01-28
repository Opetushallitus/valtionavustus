import React from 'react'

import FormUtil from 'soresu-form/web/form/FormUtil'
import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator'

import { BudgetTable } from './BudgetTable'
import FakeFormState from '../form/FakeFormState'
import SeurantaBudgetEditFormController from './SeurantaBudgetEditFormController'
import SeurantaBudgetEditComponentFactory from './SeurantaBudgetEditComponentFactory.jsx'

import '../style/budgetedit.less'
import { Answer, Avustushaku, Hakemus, Form as FormType, LegacyTranslations } from 'soresu-form/web/va/types'
import { HakuData } from '../types'
import { Muutoshakemus } from 'soresu-form/web/va/types/muutoshakemus'

interface SeurantaBudgetEditingProps {
  controller: any
  hakemus: Hakemus
  hakuData: HakuData
  avustushaku: Avustushaku
  translations: LegacyTranslations
  muutoshakemukset?: Muutoshakemus[]
}

export default class SeurantaBudgetEditing extends React.Component<SeurantaBudgetEditingProps> {
  static validateFields(form: FormType, answers?: Answer[]) {
    const budgetItems = FormUtil.findFieldsByFieldType(form.content, 'vaBudgetItemElement')
    budgetItems.map(budgetItem => {
      const amountField = budgetItem.children?.[1]
      if (amountField) {
        const overriddenValue = InputValueStorage.readValue(form.content, answers, amountField.id)
        const validationErrors = SyntaxValidator.validateSyntax(amountField, overriddenValue)
        form.validationErrors = form.validationErrors.merge({[amountField.id]: validationErrors})
      }
    })
  }

  render() {
    const {controller, hakemus, hakuData, avustushaku, translations, muutoshakemukset} = this.props

    const vaBudget = FormUtil.findFieldByFieldType(hakuData.form.content, "vaBudget")

    if (!vaBudget) {
      return null
    }

    const budgetSpecWithSelvityses = FormUtil.mergeDeepFieldTrees(
      vaBudget,
      FormUtil.findFieldByFieldType(hakemus?.selvitys?.valiselvitysForm?.content ?? [], "vaBudget") ?? {},
      FormUtil.findFieldByFieldType(hakemus?.selvitys?.loppuselvitysForm?.content ?? [], "vaBudget") ?? {})

    const budgetChangeEnabled = Array.isArray(hakemus.normalizedData?.talousarvio)
    const budgetSpec = budgetChangeEnabled
      ? { ...budgetSpecWithSelvityses, children: budgetSpecWithSelvityses.children?.filter(c => c.id !== 'project-budget') }
      : budgetSpecWithSelvityses
    const fakeHakemus = ({answers: hakemus.arvio["seuranta-answers"]} as unknown) as Hakemus
    const formOperations = {
      chooseInitialLanguage: () => "fi",
      containsExistingEntityId: undefined,
      isFieldEnabled: () => true,
      onFieldUpdate: undefined,
      isSaveDraftAllowed: () => true,
      isNotFirstEdit: () => true,
      createUiStateIdentifier: undefined,
      urlCreator: undefined,
      responseParser: undefined,
      printEntityId: undefined
    }
    const budgetEditFormState = FakeFormState.createHakemusFormState({
      translations,
      avustushaku,
      formContent: [budgetSpec],
      formOperations,
      hakemus: fakeHakemus,
      savedHakemus: hakemus
    })
    SeurantaBudgetEditing.validateFields(budgetEditFormState.form, fakeHakemus.answers)
    const formElementProps = {
      state: budgetEditFormState,
      formContainerClass: Form,
      infoElementValues: avustushaku,
      controller: new SeurantaBudgetEditFormController(controller, new SeurantaBudgetEditComponentFactory(), avustushaku, budgetEditFormState.form, hakemus),
      containerId: "budget-edit-container",
      headerElements: []
    }
    return (
      <div className="budget-edit">
        <h2>Budjetti</h2>
        {budgetChangeEnabled && muutoshakemukset && <BudgetTable muutoshakemukset={muutoshakemukset} hakemus={hakemus} hakuData={hakuData} />}
        <FormContainer {...formElementProps} />
      </div>
    )
  }
}

