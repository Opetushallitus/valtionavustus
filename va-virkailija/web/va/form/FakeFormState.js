import React, { Component } from 'react'
import Immutable from 'seamless-immutable'
import _ from 'lodash'

import FormRules from 'soresu-form/web/form/FormRules'
import FormBranchGrower from 'soresu-form/web/form/FormBranchGrower'
import FormUtil from 'soresu-form/web/form/FormUtil'

import MathUtil from 'va-common/web/va/util/MathUtil'
import VaBudgetCalculator from 'va-common/web/va/VaBudgetCalculator'
import VaSyntaxValidator from 'va-common/web/va/VaSyntaxValidator'

export default class FakeFormState {

  static resolveAttachmentsProperty(allAttachments, hakemus) {
    if (!allAttachments || !hakemus.id ) {
      return {}
    }
    const attachmentsForId = allAttachments[hakemus.id.toString()]
    return attachmentsForId ? attachmentsForId : {}
  }

  static createEditFormState(avustushaku, translations, formContent) {
    return FakeFormState.createHakemusFormState({
      translations,
      avustushaku,
      formContent,
      hakemus: {answers: {value: []}}
    })
  }

  static createHakemusFormState({
    translations,
    avustushaku,
    formContent,
    formOperations,
    hakemus,
    attachments,
    savedHakemus
  }) {
    const getFixedSelfFinancingRatioOrNull = () => {
      const ophShareFromHakemus = hakemus["budget-oph-share"]
      const totalFromHakemus = hakemus["budget-total"]
      return ophShareFromHakemus && totalFromHakemus
        ? {nominator: totalFromHakemus - ophShareFromHakemus, denominator: totalFromHakemus}
        : null
    }

    const formState = {
      avustushaku: {
        content: {
          "self-financing-percentage": avustushaku.content["self-financing-percentage"]
        }
      },
      configuration: {
        translations: translations,
        lang: "fi",
        preview: true
      },
      form: {
        content: _.cloneDeep(formContent),
        validationErrors: Immutable({})
      },
      saveStatus: {
        values: hakemus.answers,
        attachments: FakeFormState.resolveAttachmentsProperty(attachments, hakemus),
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
    budgetCalculator.deriveValuesForAllBudgetElementsByMutation(formState, {
      reportValidationErrors: true,
      fixedSelfFinancingRatio: getFixedSelfFinancingRatioOrNull()
    })

    return formState
  }
}
