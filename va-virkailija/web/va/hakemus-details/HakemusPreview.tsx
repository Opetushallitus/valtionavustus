import React, { Component } from 'react'
import _ from 'lodash'

// @ts-ignore
import DateUtil from 'soresu-form/web/DateUtil'
// @ts-ignore
import FormContainer from 'soresu-form/web/form/FormContainer'
// @ts-ignore
import FormRules from 'soresu-form/web/form/FormRules'
// @ts-ignore
import FormBranchGrower from 'soresu-form/web/form/FormBranchGrower'
// @ts-ignore
import VaComponentFactory from 'va-common/web/va/VaComponentFactory'
// @ts-ignore
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'
// @ts-ignore
import VaHakemusRegisterNumber from 'va-common/web/va/VaHakemusRegisterNumber'
// @ts-ignore
import VaChangeRequest from 'va-common/web/va/VaChangeRequest'
import GrantRefusedNotice from './GrantRefusedNotice.jsx'

import EditsDisplayingFormView, { getProjectEnd } from './EditsDisplayingFormView'
import FakeFormController from '../form/FakeFormController'
import FakeFormState from '../form/FakeFormState'
import { Answer, Hakemus, HakemusFormState } from '../types'

import '../style/formpreview.less'

import { FormikHook } from 'va-common/web/va/standardized-form-fields/types'

function getCurrentAnswers(hakemus: Hakemus): Answer[] {
  const { answers, muutoshakemukset, normalizedData } = hakemus
  const acceptedMuutoshakemus = muutoshakemukset?.find(m => m.status === 'accepted' || m.status === 'accepted_with_changes')
  const projectEnd = getProjectEnd(acceptedMuutoshakemus)
  return JSON.parse(JSON.stringify(answers)).map((a: Answer) => {
    switch (a.key) {
      case 'project-end':
        return projectEnd ? { ...a, value: projectEnd } : a
      case 'applicant-name':
        return normalizedData ? { ...a, value: normalizedData['contact-person'] } : a
      case 'primary-email':
        return normalizedData ? { ...a, value: normalizedData['contact-email'] } : a
      case 'textField-0':
        return normalizedData ? { ...a, value: normalizedData['contact-phone'] } : a
      default:
        return a
    }
  })
}

interface HakemusPreviewProps { 
  hakemus: Hakemus
  avustushaku: any
  environment: any
  hakuData: any
  translations: any,
  f: FormikHook
}

export const HakemusPreview = ({ hakemus, avustushaku, hakuData, translations, environment, f }: HakemusPreviewProps) => {

    const registerNumber = _.get(hakemus, "register-number", "")
    const formState = createPreviewHakemusFormState()
    const registerNumberDisplay = <VaHakemusRegisterNumber key="register-number"
                                                           registerNumber={registerNumber}
                                                           translations={formState.configuration.translations}
                                                           lang={formState.configuration.lang} />
    const changeRequests =  <VaChangeRequests key="change-request"
                                              changeRequests={hakemus.changeRequests}
                                              translations={formState.configuration.translations}
                                              lang={formState.configuration.lang}/>
    const versionDate = hakemus['version-date']

    const formattedVersionDate = `${DateUtil.asDateString(versionDate)} klo ${DateUtil.asTimeString(versionDate)}`
    const postSubmitModified = hakemus["submitted-version"] &&
            hakemus["submitted-version"] !== hakemus.version
    const formElementProps = {
      state: formState,
      formContainerClass: EditsDisplayingFormView,
      infoElementValues: avustushaku,
      controller: new FakeFormController(new VaComponentFactory(), new VaPreviewComponentFactory(), avustushaku, hakemus),
      containerId: "preview-container",
      headerElements: [registerNumberDisplay,
                       changeRequests,
                       <small key="version-date">
                         Päivitetty
                         {postSubmitModified ? " lähettämisen jälkeen" : ""}
                         <span className="modified-date">
                           {formattedVersionDate}
                         </span>
                       </small>,
                       <GrantRefusedNotice application={hakemus}
                                           key="grant-refused" />],
      f,
      environment
    }

    return  (
      <FormContainer {...formElementProps} />
      )

    function createPreviewHakemusFormState(): HakemusFormState {
      const hakemusFormState = FakeFormState.createHakemusFormState({
        translations,
        avustushaku,
        formContent: hakuData.form.content,
        attachments: hakuData.attachments,
        hakemus
      })
      const effectiveForm = hakemusFormState.form
      effectiveForm.content = _.filter(effectiveForm.content, field => field.fieldClass !== "infoElement")
      const formSpecification = hakuData.form
      const currentAnswers = hakemus.answers
      hakemusFormState.answersDelta = EditsDisplayingFormView.resolveChangedFields(currentAnswers, hakemusFormState.changeRequests, hakemusFormState.attachmentVersions, hakemus.muutoshakemukset, hakemus.normalizedData)

      const oldestAnswers = (hakemusFormState.changeRequests && hakemusFormState.changeRequests.length > 0)
        ? hakemusFormState.changeRequests[0].answers
        : hakemus.muutoshakemukset?.length
          ? hakemus.answers
          : {}
      const combinedAnswersForPopulatingGrowingFieldsets = _.mergeWith(_.cloneDeep(currentAnswers), _.cloneDeep(oldestAnswers), (a, b) => {
        return _.isArray(a) ? uniqueUnion(a, b) : undefined

        function uniqueUnion(firstAnswerArray: Answer[], secondAnswerArray: Answer[]) {
          return _.uniqBy(_.union(firstAnswerArray, secondAnswerArray), (answer: Answer) => { return answer.key })
        }
      })

      FormRules.applyRulesToForm(formSpecification, effectiveForm, currentAnswers)
      FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(formSpecification.content, effectiveForm.content, combinedAnswersForPopulatingGrowingFieldsets, false)
      hakemusFormState.saveStatus.values = getCurrentAnswers(hakemus)
      console.log('hakemus', hakemus)
      return hakemusFormState
    }
  }

class VaChangeRequests extends Component<any> {
  render() {
    const changeRequestElements = this.props.changeRequests
      ? _.map(this.props.changeRequests, cr => <VaChangeRequest
            hakemus={cr}
            key={cr.version}
            translations={this.props.translations}
            lang={this.props.lang}
          />)
          .reverse()
      : []

    return <div>{changeRequestElements}</div>
  }
}
