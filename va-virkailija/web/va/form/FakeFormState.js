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

  static createEditFormState(translations, formDraftJson, formOperations) {
    const hakuData = Immutable({form: formDraftJson})
    return FakeFormState.createHakemusFormState(translations, hakuData, {}, formOperations)
  }

  static createHakemusFormState(translations, hakuData, hakemus, formOperations) {
    const attachments = FakeFormState.resolveAttachmentsProperty(hakuData, hakemus)
    const answers = hakemus.answers
    const formSpecification = hakuData.form
    const effectiveForm = _.cloneDeep(formSpecification)
    effectiveForm.validationErrors = Immutable({})

    const formState = {
      configuration: {
        translations: translations,
        lang: "fi",
        preview: true
      },
      form: effectiveForm,
      saveStatus: {
        values: answers,
        attachments: attachments
      },
      changeRequests: hakemus.changeRequests,
      attachmentVersions: hakemus.attachmentVersions,
      extensionApi: {
        formOperations: formOperations
      }
    }

    const budgetCalculator = new VaBudgetCalculator()
    budgetCalculator.populateBudgetCalculatedValuesForAllBudgetFields(formState, true)
    return formState
  }
}
