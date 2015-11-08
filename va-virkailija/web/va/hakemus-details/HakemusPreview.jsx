import React, { Component } from 'react'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import FormPreview from 'soresu-form/web/form/FormPreview.jsx'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'
import VaHakemusRegisterNumber from 'va-common/web/va/VaHakemusRegisterNumber.jsx'

import FakeFormController from '../form/FakeFormController.js'
import FakeFormState from '../form/FakeFormState.js'

export default class HakemusPreview extends Component {
  render() {
    const hakemus = this.props.hakemus
    const registerNumber = _.get(hakemus, "register-number", "")
    const avustushaku = this.props.avustushaku
    const hakuData = this.props.hakuData
    const translations = this.props.translations
    const formState = FakeFormState.createHakemusFormState(translations, hakuData, hakemus)
    const registerNumberDisplay = <VaHakemusRegisterNumber registerNumber={registerNumber}
                                                           translations={formState.configuration.translations}
                                                           lang={formState.configuration.lang} />
    const formElementProps = {
      state: formState,
      infoElementValues: avustushaku,
      controller: new FakeFormController(new VaPreviewComponentFactory(), avustushaku, hakemus)
    }
    return (
      <div id="preview-container">
        {registerNumberDisplay}
        <FormPreview {...formElementProps} />
      </div>
    )
  }
}
