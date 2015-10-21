import React, { Component } from 'react'
import Immutable from 'seamless-immutable'

import FormRules from 'soresu-form/web/form/FormRules'
import FormBranchGrower from 'soresu-form/web/form/FormBranchGrower'

import VaBudgetCalculator from 'va-common/web/va/VaBudgetCalculator'

import FakeFormController from './FakeFormController.js'

export default class FakeFormState {

  static resolveAttachmentsProperty(hakuData, hakemus) {
    if (!hakuData.attachments || !hakemus.id ) {
      return {}
    }
    const attachments = hakuData.attachments[hakemus.id.toString()]
    return attachments ? attachments : {}
  }

  static createEditFormState(translations, formDraftJson) {
    const hakuData = Immutable({form: formDraftJson})
    return FakeFormState.createHakemusFormState(translations, hakuData, {})
  }

  static createHakemusFormState(translations, hakuData, hakemus) {
    const attachments = FakeFormState.resolveAttachmentsProperty(hakuData, hakemus)
    const answers = hakemus.answers
    const formSpecification = hakuData.form
    const effectiveForm = _.cloneDeep(formSpecification)
    effectiveForm.validationErrors = Immutable({})
    FormRules.applyRulesToForm(formSpecification, effectiveForm, answers)

    const formState = {
      configuration: {
        translations: translations,
        lang: "fi"
      },
      form: effectiveForm,
      saveStatus: {
        values: answers,
        attachments: attachments
      }
    }

    if(answers) {
      FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(formSpecification.content, effectiveForm.content, answers)
    }
    const budgetCalculator = new VaBudgetCalculator()
    budgetCalculator.populateBudgetCalculatedValuesForAllBudgetFields(formState, true)
    return formState
  }

  resolveAttachmentsProperty(hakuData, hakemus) {
    if (!hakuData.attachments || !hakemus.id ) {
      return {}
    }
    const attachments = hakuData.attachments[hakemus.id.toString()]
    return attachments ? attachments : {}
  }
}
