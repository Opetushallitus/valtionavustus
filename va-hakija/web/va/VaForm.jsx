import React from 'react'
import _ from 'lodash'

import style from './style/main.less'

import VaFormTopbar from './VaFormTopbar.jsx'
import VaOldBrowserWarning from './VaOldBrowserWarning.jsx'
import VaHakemusRegisterNumber from 'va-common/web/va/VaHakemusRegisterNumber.jsx'
import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import FormPreview from 'soresu-form/web/form/FormPreview.jsx'

export default class VaForm extends React.Component {
  render() {
    const controller = this.props.controller
    const state = this.props.state
    const registerNumber = _.get(state.saveStatus.savedObject, "register-number", undefined)
    const registerNumberDisplay = <VaHakemusRegisterNumber registerNumber={registerNumber}
                                                           translations={state.configuration.translations}
                                                           lang={state.configuration.lang} />

    const develQueryParam = this.props.develQueryParam
    const formContainerClass = state.configuration.preview ? FormPreview : Form
    return(
      <div>
        <VaOldBrowserWarning lang={state.configuration.lang}
                             translations={state.configuration.translations.warning}
                             devel={develQueryParam}
        />
        <VaFormTopbar controller={controller}
                      state={state}
        />
        <FormContainer controller={controller}
                       state={state}
                       formContainerClass={formContainerClass}
                       headerElements={registerNumberDisplay}
                       infoElementValues={state.avustushaku}
        />
      </div>
    )
  }
}
