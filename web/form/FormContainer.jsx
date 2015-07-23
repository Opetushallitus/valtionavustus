import React from 'react'
import Form from './Form.jsx'
import _ from 'lodash'

import FormPreview from './FormPreview.jsx'

export default class FormContainer extends React.Component {
  render() {
    const controller = this.props.controller
    const state = this.props.state
    const infoElementValues = this.props.infoElementValues
    const configuration = state.configuration
    const translations = configuration.translations
    const preview = configuration.preview
    const lang = configuration.lang

    var formElement

    if (preview) {
      formElement = <FormPreview controller={controller}
                                 infoElementValues={infoElementValues}
                                 lang={lang}
                                 translations={translations}
                                 state={state}/>
    } else {
      formElement = <Form controller={controller}
                          infoElementValues={infoElementValues}
                          translations={translations}
                          lang={lang}
                          state={state}/>
    }

    return (
      <section id="container">
        {formElement}
      </section>
    )
  }
}
