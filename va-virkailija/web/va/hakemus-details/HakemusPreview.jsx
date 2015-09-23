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
    const attachments = this.resolveAttachmentsProperty(hakuData, hakemus)
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
        attachments: attachments
      }
    }
    const formElementProps = {
      state: formState,
      infoElementValues: avustushaku,
      controller: new FakeFormController(avustushaku, hakemus)
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

  resolveAttachmentsProperty(hakuData, hakemus) {
    if (!hakuData.attachments || !hakemus ) {
      return {}
    }
    const attachments = hakuData.attachments[hakemus.id.toString()]
    return attachments ? attachments : {}
  }
}

class FakeFormController {
  constructor(avustushaku, hakemus) {
    this.avustushaku = avustushaku
    this.hakemus = hakemus
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
    return "api/avustushaku/" + this.avustushaku.id + "/hakemus/" + this.hakemus.id + "/attachments/" + field.id
  }
}
