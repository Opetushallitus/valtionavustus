import './formpreview.css'

import React, { Component } from 'react'
import _ from 'lodash'

import DateUtil from 'soresu-form/web/DateUtil'
import FormContainer from 'soresu-form/web/form/FormContainer'
import FormRules from 'soresu-form/web/form/FormRules'
import FormBranchGrower from 'soresu-form/web/form/FormBranchGrower'
import VaComponentFactory from 'soresu-form/web/va/VaComponentFactory'
import VaPreviewComponentFactory from 'soresu-form/web/va/VaPreviewComponentFactory'
import VaHakemusRegisterNumber from 'soresu-form/web/va/VaHakemusRegisterNumber'
import VaChangeRequest from 'soresu-form/web/va/VaChangeRequest'
import { mapAnswersWithMuutoshakemusData } from 'soresu-form/web/va/MuutoshakemusMapper'
import { Answer, Avustushaku, Hakemus, HakemusFormState } from 'soresu-form/web/va/types'
import { dateStringToMaybeFinnishDate } from 'soresu-form/web/va/Muutoshakemus'

import EditsDisplayingFormView from '../common-components/EditsDisplayingFormView'
import GrantRefusedNotice from './GrantRefusedNotice'
import FakeFormController from '../../../form/FakeFormController'
import FakeFormState from '../../../form/FakeFormState'
import { HakuData } from '../../../types'

interface HakemusPreviewProps {
  hakemus: Hakemus
  avustushaku: Avustushaku
  hakuData: HakuData
}

const HakemusPreview = (props: HakemusPreviewProps) => {
  const { hakemus, avustushaku } = props
  const registerNumber = _.get(hakemus, 'register-number', '')
  const formState = createPreviewHakemusFormState(props)
  const registerNumberDisplay = (
    <VaHakemusRegisterNumber
      key="register-number"
      registerNumber={registerNumber}
      translations={formState.configuration.translations}
      lang={formState.configuration.lang}
    />
  )
  const changeRequests = (
    <VaChangeRequests
      key="change-request"
      changeRequests={hakemus.changeRequests}
      translations={formState.configuration.translations}
      lang={formState.configuration.lang}
    />
  )
  const versionDate = hakemus['version-date']

  const formattedVersionDate = `${DateUtil.asDateString(versionDate)} klo ${DateUtil.asTimeString(
    versionDate
  )}`
  const postSubmitModified =
    hakemus['submitted-version'] && hakemus['submitted-version'] !== hakemus.version
  const formElementProps = {
    state: formState,
    form: EditsDisplayingFormView,
    infoElementValues: avustushaku,
    controller: new FakeFormController(
      new VaComponentFactory(),
      new VaPreviewComponentFactory(),
      avustushaku,
      hakemus
    ),
    containerId: 'preview-container',
    headerElements: [
      registerNumberDisplay,
      changeRequests,
      <small key="version-date">
        Päivitetty
        {postSubmitModified ? ' lähettämisen jälkeen' : ''}
        <span className="modified-date">{formattedVersionDate}</span>
      </small>,
      <GrantRefusedNotice application={hakemus} key="grant-refused" />,
    ],
  }
  return <FormContainer {...formElementProps} />
}

export default HakemusPreview

const createPreviewHakemusFormState = ({
  hakemus,
  avustushaku,
  hakuData,
}: HakemusPreviewProps): HakemusFormState => {
  const hakemusFormState = FakeFormState.createHakemusFormState({
    avustushaku,
    formContent: hakuData.form.content,
    attachments: hakuData.attachments,
    hakemus,
  })
  const effectiveForm = hakemusFormState.form
  effectiveForm.content = _.filter(
    effectiveForm.content,
    (field) => field.fieldClass !== 'infoElement'
  )
  const formSpecification = hakuData.form
  const currentAnswers = overrideProjectStartEndFromPaatos(avustushaku, hakemus.answers)
  hakemusFormState.answersDelta = EditsDisplayingFormView.resolveChangedFields(
    avustushaku,
    currentAnswers,
    hakemusFormState.changeRequests,
    hakemusFormState.attachmentVersions,
    hakemus.muutoshakemukset,
    hakemus.normalizedData
  )

  const oldestAnswers =
    hakemusFormState.changeRequests && hakemusFormState.changeRequests.length > 0
      ? hakemusFormState.changeRequests[0].answers
      : hakemus.muutoshakemukset?.length
        ? hakemus.answers
        : {}
  const combinedAnswersForPopulatingGrowingFieldsets = _.mergeWith(
    _.cloneDeep(currentAnswers),
    _.cloneDeep(oldestAnswers),
    (a, b) => {
      return _.isArray(a) ? uniqueUnion(a, b) : undefined

      function uniqueUnion(firstAnswerArray: Answer[], secondAnswerArray: Answer[]) {
        return _.uniqBy(_.union(firstAnswerArray, secondAnswerArray), (answer: Answer) => {
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
  hakemusFormState.saveStatus.values = mapAnswersWithMuutoshakemusData(
    avustushaku,
    hakemus.answers,
    hakemus.muutoshakemukset,
    hakemus.normalizedData
  )
  return hakemusFormState
}

const overrideProjectStartEndFromPaatos = (avustushaku: Avustushaku, answers: Answer[]) => {
  const hankkeenAlkamisPaiva = dateStringToMaybeFinnishDate(avustushaku['hankkeen-alkamispaiva'])
  const hankkeenPaattymisPaiva = dateStringToMaybeFinnishDate(
    avustushaku['hankkeen-paattymispaiva']
  )
  return answers.map((answer) => {
    if (hankkeenAlkamisPaiva && answer.key === 'project-begin') {
      return {
        ...answer,
        value: hankkeenAlkamisPaiva,
      }
    } else if (hankkeenPaattymisPaiva && answer.key === 'project-end') {
      return {
        ...answer,
        value: hankkeenPaattymisPaiva,
      }
    }
    return answer
  })
}

class VaChangeRequests extends Component<any> {
  render() {
    const changeRequestElements = this.props.changeRequests
      ? _.map(this.props.changeRequests, (cr) => (
        <VaChangeRequest
          hakemus={cr}
          key={cr.version}
          translations={this.props.translations}
          lang={this.props.lang}
        />
      )).reverse()
      : []

    return <div>{changeRequestElements}</div>
  }
}
