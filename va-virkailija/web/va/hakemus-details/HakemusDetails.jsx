import React, { Component } from 'react'

import FormPreview from 'va-common/web/form/FormPreview.jsx'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'

export default class HakemusDetails extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const hakuData = this.props.hakuData
    const translations = this.props.translations
    const controller = new FakeFormController(avustushaku)
    const formState = {
      configuration: {
        translations: translations,
        lang: "fi"
      },
      form: hakuData.form,
      saveStatus: {
        values: hakemus.answers
      }
    }
    const formElementProps = {
      state: formState,
      infoElementValues: avustushaku,
      controller: controller
    }
    return (
      <div id="hakemus-details">
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
}
