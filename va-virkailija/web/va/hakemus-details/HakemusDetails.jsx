import React, { Component } from 'react'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import FormPreview from 'va-common/web/form/FormPreview.jsx'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'
import VaBudgetCalculator from 'va-common/web/va/VaBudgetCalculator'
import FormRules from 'va-common/web/form/FormRules'

import HakemusArviointi from './HakemusArviointi.jsx'

export default class HakemusDetails extends Component {
  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const hakuData = this.props.hakuData
    const translations = this.props.translations

    const answers = hakemus.answers
    const formSpecification = hakuData.form
    formSpecification.validationErrors = Immutable({})
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
        values: answers
      }
    }
    const formElementProps = {
      state: formState,
      infoElementValues: avustushaku,
      controller: new FakeFormController(avustushaku)
    }
    const budgetCalculator = new VaBudgetCalculator()
    budgetCalculator.populateBudgetCalculatedValuesForAllBudgetFields(formState, true)
    return (
      <div id="hakemus-details">
        <div id="preview-container">
          <FormPreview {...formElementProps}/>
        </div>
        <HakemusArviointi hakemus={hakemus} controller={controller}/>
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
