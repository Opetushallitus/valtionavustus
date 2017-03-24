import React, { Component } from 'react'
import Immutable from 'seamless-immutable'

import FormRules from 'soresu-form/web/form/FormRules'
import FormBranchGrower from 'soresu-form/web/form/FormBranchGrower'

import _ from 'lodash'

import VaBudgetCalculator from 'va-common/web/va/VaBudgetCalculator'
import VaSyntaxValidator from 'va-common/web/va/VaSyntaxValidator'

export default class FakeFormState {

  static resolveAttachmentsProperty(hakuData, hakemus) {
    if (!hakuData.attachments || !hakemus.id ) {
      return {}
    }
    const attachments = hakuData.attachments[hakemus.id.toString()]
    return attachments ? attachments : {}
  }

  static createEditFormState(avustushaku, translations, formDraftJson) {
    const hakuData = Immutable({
      "self-financing-percentage": avustushaku.content["self-financing-percentage"],
      form: formDraftJson
    })
    const hakemus = {answers: {value: []}}
    return FakeFormState.createHakemusFormState(translations, hakuData, hakemus)
  }

  static createHakemusFormState(translations, hakuData, hakemus, formOperations, savedHakemus) {
    const attachments = FakeFormState.resolveAttachmentsProperty(hakuData, hakemus)
    const answers = hakemus.answers
    const formSpecification = hakuData.form
    const effectiveForm = _.cloneDeep(formSpecification)
    effectiveForm.validationErrors = Immutable({})

    const formState = {
      avustushaku: {
        content: {
          "self-financing-percentage": hakuData["self-financing-percentage"]
        }
      },
      configuration: {
        translations: translations,
        lang: "fi",
        preview: true
      },
      form: effectiveForm,
      saveStatus: {
        values: answers,
        attachments: attachments,
        savedObject: savedHakemus
      },
      changeRequests: hakemus.changeRequests,
      attachmentVersions: hakemus.attachmentVersions,
      extensionApi: {
        formOperations: formOperations,
        customFieldSyntaxValidator: VaSyntaxValidator
      }
    }

    const budgetCalculator = new VaBudgetCalculator()
    budgetCalculator.populateBudgetCalculatedValuesForAllBudgetFields(formState, true)
    return formState
  }
}
