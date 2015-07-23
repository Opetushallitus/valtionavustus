import React from 'react'
import Form from './Form.jsx'
import _ from 'lodash'

import FormPreview from './FormPreview.jsx'

export default class FormContainer extends React.Component {
  render() {
    const controller = this.props.controller
    const state = this.props.state
    const infoElementValues = this.props.infoElementValues
    const form = state.form
    const validationErrors = state.validationErrors
    const values = state.saveStatus.values
    const configuration = state.configuration
    const translations = configuration.translations
    const preview = configuration.preview
    const lang = configuration.lang

    var formElement

    if (preview) {
      formElement = <FormPreview controller={controller}
                                 infoElementValues={infoElementValues}
                                 form={form}
                                 lang={lang}
                                 translations={translations}
                                 values={values}
                                 state={state}/>
    } else {
      formElement = <Form controller={controller}
                          validationErrors={validationErrors}
                          infoElementValues={infoElementValues}
                          translations={translations}
                          form={form}
                          lang={lang}
                          saved={controller.isSaveDraftAllowed(state)}
                          values={values}
                          state={state}/>
    }

    return (
      <section id="container">
        {formElement}
      </section>
    )
  }
}
