import React from 'react'
import _ from 'lodash'

import FormContainer from 'soresu-form/web/form/FormContainer.jsx'
import Form from 'soresu-form/web/form/Form.jsx'
import FormPreview from 'soresu-form/web/form/FormPreview.jsx'

import VaHakemusRegisterNumber from 'va-common/web/va/VaHakemusRegisterNumber.jsx'
import VaChangeRequest from 'va-common/web/va/VaChangeRequest.jsx'

import VaFormTopbar from './VaFormTopbar.jsx'
import VaOldBrowserWarning from './VaOldBrowserWarning.jsx'

import GrantRefuse from './GrantRefuse.jsx'

import './style/main.less'

export default class VaForm extends React.Component {
  render() {
    const {controller, state, hakemusType} = this.props
    const registerNumber = _.get(state.saveStatus.savedObject, "register-number", undefined)
    const {saveStatus, configuration} = state
    const registerNumberDisplay = <VaHakemusRegisterNumber key="register-number"
                                                           registerNumber={registerNumber}
                                                           translations={configuration.translations}
                                                           lang={configuration.lang} />
    const changeRequest =  <VaChangeRequest key="change-request"
                                            hakemus={saveStatus.savedObject}
                                            translations={configuration.translations}
                                            lang={configuration.lang} />
    const headerElements = [registerNumberDisplay, changeRequest]
    const formContainerClass = configuration.preview ? FormPreview : Form
    return(
      <div>
        <VaOldBrowserWarning lang={configuration.lang}
                             translations={configuration.translations.warning}
                             devel={configuration.develMode}
        />
        <VaFormTopbar controller={controller}
                      state={state}
                      hakemusType={hakemusType}
        />
        {configuration.environment["grant-refuse"] &&
          configuration.environment["grant-refuse"]["enabled?"] &&
          configuration.preview &&
          <GrantRefuse controller={controller} state={state}/>}
        <FormContainer controller={controller}
                       state={state}
                       formContainerClass={formContainerClass}
                       headerElements={headerElements}
                       infoElementValues={state.avustushaku}
                       hakemusType={this.props.hakemusType}
                       useBusinessIdSearch={this.props.useBusinessIdSearch}
        />
      </div>
    )
  }
}
