import React, { Component } from 'react'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import FormPreview from 'soresu-form/web/form/FormPreview.jsx'
import FormRules from 'soresu-form/web/form/FormRules'
import FormBranchGrower from 'soresu-form/web/form/FormBranchGrower'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'
import VaHakemusRegisterNumber from 'va-common/web/va/VaHakemusRegisterNumber.jsx'

import EditsDisplayingFormView from './EditsDisplayingFormView.jsx'
import FakeFormController from '../form/FakeFormController.js'
import FakeFormState from '../form/FakeFormState.js'

export default class HakemusPreview extends Component {
  render() {
    const hakemus = this.props.hakemus
    const registerNumber = _.get(hakemus, "register-number", "")
    const avustushaku = this.props.avustushaku
    const hakuData = this.props.hakuData
    const translations = this.props.translations
    const formState = createPreviewHakemusFormState()
    const registerNumberDisplay = <VaHakemusRegisterNumber registerNumber={registerNumber}
                                                           translations={formState.configuration.translations}
                                                           lang={formState.configuration.lang} />
    const formElementProps = {
      state: formState,
      formContainerClass: EditsDisplayingFormView,
      infoElementValues: avustushaku,
      controller: new FakeFormController(new VaPreviewComponentFactory(), avustushaku, hakemus),
      containerId: "preview-container",
      headerElements: registerNumberDisplay,
    }
    return <FormContainer {...formElementProps} />

    function createPreviewHakemusFormState() {
      const hakemusFormState = FakeFormState.createHakemusFormState(translations, hakuData, hakemus)
      const effectiveForm = hakemusFormState.form
      effectiveForm.content = _.filter(effectiveForm.content, field => field.fieldClass !== "infoElement")
      const formSpecification = hakuData.form
      const currentAnswers = hakemus.answers

      hakemusFormState.answersDelta = EditsDisplayingFormView.resolveChangedFields(currentAnswers, hakemusFormState.changeRequests, hakemusFormState.attachmentVersions)
      const oldestAnswers = (hakemusFormState.changeRequests && hakemusFormState.changeRequests.length > 0) ? hakemusFormState.changeRequests[0].answers : {}
      const combinedAnswersForPopulatingGrowingFieldsets = _.merge(_.cloneDeep(currentAnswers), _.cloneDeep(oldestAnswers), (a, b) => {
        return _.isArray(a) ? uniqueUnion(a, b) : undefined

        function uniqueUnion(firstAnswerArray, secondAnswerArray) {
          return _.uniq(_.union(firstAnswerArray, secondAnswerArray), answer => { return answer.key })
        }
      })

      FormRules.applyRulesToForm(formSpecification, effectiveForm, currentAnswers)
      FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(formSpecification.content, effectiveForm.content, combinedAnswersForPopulatingGrowingFieldsets)
      return hakemusFormState
    }
  }
}
