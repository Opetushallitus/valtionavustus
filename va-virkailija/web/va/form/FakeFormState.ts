import Immutable from 'seamless-immutable'
import { cloneDeep } from 'lodash'

import translations from '../../../../server/resources/public/translations.json'
import VaBudgetCalculator from 'soresu-form/web/va/VaBudgetCalculator'
import VaSyntaxValidator from 'soresu-form/web/va/VaSyntaxValidator'
import { Avustushaku, Field, Hakemus, HakemusFormState } from 'soresu-form/web/va/types'

type InitialFakeFormState = {
  avustushaku: Avustushaku
  formContent: any
  formOperations?: any
  hakemus: Hakemus
  attachments?: any
  savedHakemus?: any
}

export default class FakeFormState {
  static resolveAttachmentsProperty(allAttachments: any, hakemus: Hakemus) {
    if (!allAttachments || !hakemus.id) {
      return {}
    }
    const attachmentsForId = allAttachments[hakemus.id.toString()]
    return attachmentsForId ? attachmentsForId : {}
  }

  static createEditFormState(avustushaku: Avustushaku, formContent: Field[]) {
    return FakeFormState.createHakemusFormState({
      avustushaku,
      formContent,
      hakemus: { answers: [] } as unknown as Hakemus,
    })
  }

  static createHakemusFormState({
    avustushaku,
    formContent,
    formOperations,
    hakemus,
    attachments,
    savedHakemus,
  }: InitialFakeFormState): HakemusFormState {
    const getFixedSelfFinancingRatioOrNull = () => {
      const ophShareFromHakemus = hakemus['budget-oph-share']
      const totalFromHakemus = hakemus['budget-total']
      return ophShareFromHakemus && totalFromHakemus
        ? {
            nominator: totalFromHakemus - ophShareFromHakemus,
            denominator: totalFromHakemus,
          }
        : null
    }

    const formState: HakemusFormState = {
      avustushaku: {
        content: {
          'self-financing-percentage': avustushaku.content['self-financing-percentage'],
        },
      },
      configuration: {
        translations: Immutable(translations),
        lang: 'fi',
        preview: true,
      },
      form: {
        content: cloneDeep(formContent),
        validationErrors: Immutable({}),
      },
      saveStatus: {
        values: hakemus.answers,
        attachments: FakeFormState.resolveAttachmentsProperty(attachments, hakemus),
        savedObject: savedHakemus,
      },
      changeRequests: hakemus.changeRequests,
      attachmentVersions: hakemus.attachmentVersions,
      extensionApi: {
        formOperations: formOperations,
        customFieldSyntaxValidator: VaSyntaxValidator,
      },
      answersDelta: {
        changedAnswers: [],
        newAnswers: [],
      },
    }

    const budgetCalculator = new VaBudgetCalculator()
    budgetCalculator.deriveValuesForAllBudgetElementsByMutation(formState, {
      reportValidationErrors: true,
      fixedSelfFinancingRatio: getFixedSelfFinancingRatioOrNull(),
    })

    return formState
  }
}
