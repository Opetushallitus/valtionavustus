import React from 'react'
import _ from 'lodash'

import VaTopbar from './VaTopbar.jsx'
import VaOldBrowserWarning from './VaOldBrowserWarning.jsx'
import FormContainer from './../form/FormContainer.jsx'

export default class VaForm extends React.Component {
  render() {
    const controller = this.props.controller
    const state = this.props.state
    const develQueryParam = this.props.develQueryParam
    return(
      <div>
        <VaOldBrowserWarning lang={state.configuration.lang}
                             translations={state.configuration.translations.warning}
                             devel={develQueryParam}
        />
        <VaTopbar controller={controller}
                  state={state}
        />
        <FormContainer controller={controller}
                       state={state}
                        infoElementValues={state.avustushaku}
        />
      </div>
    )
  }
}