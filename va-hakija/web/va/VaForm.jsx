import React from 'react'
import _ from 'lodash'

import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import FormPreview from 'soresu-form/web/form/FormPreview.jsx'

import VaHakemusRegisterNumber from 'va-common/web/va/VaHakemusRegisterNumber.jsx'
import VaChangeRequest from 'va-common/web/va/VaChangeRequest.jsx'

import VaFormTopbar from './VaFormTopbar.jsx'
import VaOldBrowserWarning from './VaOldBrowserWarning.jsx'

import style from './style/main.less'

export default class VaForm extends React.Component {
  render() {
    const {controller, state, hakemusType} = this.props
    const registerNumber = _.get(state.saveStatus.savedObject, "register-number", undefined)
    const registerNumberDisplay = <VaHakemusRegisterNumber key="register-number"
                                                           registerNumber={registerNumber}
                                                           translations={state.configuration.translations}
                                                           lang={state.configuration.lang} />
    const saveStatus = state.saveStatus
    const changeRequest =  <VaChangeRequest key="change-request"
                                            hakemus={saveStatus.savedObject}
                                            translations={state.configuration.translations}
                                            lang={state.configuration.lang} />
    const headerElements = [registerNumberDisplay, changeRequest]
    const formContainerClass = state.configuration.preview ? FormPreview : Form
    return(
      <div>
        <VaOldBrowserWarning lang={state.configuration.lang}
                             translations={state.configuration.translations.warning}
                             devel={state.configuration.develMode}
        />
        <VaFormTopbar controller={controller}
                      state={state}
                      hakemusType={hakemusType}
        />
        <FormContainer controller={controller}
                       state={state}
                       formContainerClass={formContainerClass}
                       headerElements={headerElements}
                       infoElementValues={state.avustushaku}
                       hakemusType = {this.props.hakemusType}
                       showBusinessIdSearch = {this.props.showBusinessIdSearch}
        />
      </div>
    )
  }
}
