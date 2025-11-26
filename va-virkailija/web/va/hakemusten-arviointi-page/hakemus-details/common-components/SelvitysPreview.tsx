import React from 'react'
import _ from 'lodash'

import FormContainer from 'soresu-form/web/form/FormContainer'
import FormRules from 'soresu-form/web/form/FormRules'
import FormBranchGrower from 'soresu-form/web/form/FormBranchGrower'
import VaComponentFactory from 'soresu-form/web/va/VaComponentFactory'
import VaPreviewComponentFactory from 'soresu-form/web/va/VaPreviewComponentFactory'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'
import EditsDisplayingFormView from './EditsDisplayingFormView'
import FakeFormController from '../../../form/FakeFormController'
import FakeFormState from '../../../form/FakeFormState'

type SelvitysPreviewProps = {
  hakemus: Hakemus
  selvitysType: 'valiselvitys' | 'loppuselvitys'
  avustushaku: Avustushaku
  selvitysHakemus: any
  form: any
}

export function SelvitysPreview({
  hakemus,
  selvitysType,
  avustushaku,
  selvitysHakemus: hakemusThatCannotBeMutatedDirectly,
  form,
}: SelvitysPreviewProps) {
  const selvitysHakemus = _.cloneDeep(hakemusThatCannotBeMutatedDirectly)
  const selvitys = hakemus.selvitys
  const formState = createPreviewHakemusFormState()
  const formElementProps = {
    state: formState,
    form: EditsDisplayingFormView,
    infoElementValues: avustushaku,
    controller: new FakeFormController(
      new VaComponentFactory(),
      new VaPreviewComponentFactory(),
      avustushaku,
      selvitysHakemus
    ),
    containerId: `preview-container-${selvitysType}`,
    headerElements: [],
  }
  return <FormContainer {...formElementProps} />

  function createPreviewHakemusFormState() {
    const hakemusFormState = FakeFormState.createHakemusFormState({
      avustushaku,
      formContent: form.content,
      hakemus: selvitysHakemus,
      attachments: selvitys?.attachments,
    })

    const effectiveForm = hakemusFormState.form
    effectiveForm.content = _.filter(
      effectiveForm.content,
      (field) => field.fieldClass !== 'infoElement'
    )
    const formSpecification = form
    const currentAnswers = selvitysHakemus.answers

    hakemusFormState.answersDelta = EditsDisplayingFormView.resolveChangedFields(
      avustushaku,
      currentAnswers,
      hakemusFormState.changeRequests,
      hakemusFormState.attachmentVersions
    )
    const oldestAnswers =
      hakemusFormState.changeRequests && hakemusFormState.changeRequests.length > 0
        ? hakemusFormState.changeRequests[0].answers
        : {}
    const combinedAnswersForPopulatingGrowingFieldsets = _.mergeWith(
      _.cloneDeep(currentAnswers),
      _.cloneDeep(oldestAnswers),
      (a, b) => {
        return _.isArray(a) ? uniqueUnion(a, b) : undefined

        function uniqueUnion(firstAnswerArray: any[], secondAnswerArray: any[]) {
          return _.uniqBy(_.union(firstAnswerArray, secondAnswerArray), (answer: any) => {
            return answer.key
          })
        }
      }
    )

    FormRules.applyRulesToForm(formSpecification, effectiveForm, currentAnswers)
    FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(
      formSpecification.content,
      effectiveForm.content,
      combinedAnswersForPopulatingGrowingFieldsets,
      false
    )
    return hakemusFormState
  }
}
