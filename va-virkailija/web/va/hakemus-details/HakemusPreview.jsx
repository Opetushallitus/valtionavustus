import React, { Component } from 'react'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import FormPreview from 'va-common/web/form/FormPreview.jsx'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'
import VaBudgetCalculator from 'va-common/web/va/VaBudgetCalculator'
import FormBranchGrower from 'va-common/web/form/FormBranchGrower'
import FormRules from 'va-common/web/form/FormRules'

export default class HakemusPreview extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const hakuData = this.props.hakuData
    const translations = this.props.translations

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
        attachments: {}
      }
    }
    const formElementProps = {
      state: formState,
      infoElementValues: avustushaku,
      controller: new FakeFormController(avustushaku)
    }

    FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(formSpecification.content, effectiveForm.content, answers)

    const budgetCalculator = new VaBudgetCalculator()
    budgetCalculator.populateBudgetCalculatedValuesForAllBudgetFields(formState, true)

    return (
      <div id="preview-container">
        <FormPreview {...formElementProps}/>
      </div>
    )
  }
}

class FakeFormController {
  constructor(avustushaku) {
    this.avustushaku = avustushaku
    this.customPreviewComponentFactory = new VaPreviewComponentFactory()
  }

  constructHtmlId(fields, fieldId) {
    return fieldId
  }

  getCustomWrapperComponentProperties() {
    return this.avustushaku
  }

  getCustomPreviewComponentTypeMapping() {
    return this.customPreviewComponentFactory.fieldTypeMapping
  }

  createCustomPreviewComponent(componentProps) {
    return this.customPreviewComponentFactory.createComponent(componentProps)
  }

  getCustomWrapperComponentProperties(state) {
    return { "avustushaku": this.avustushaku }
  }

  createAttachmentDownloadUrl(state, field) {
    // TODO: implement to create attachment download URL
    return "/not/implemented/yet"
  }
}
