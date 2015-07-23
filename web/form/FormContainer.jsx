import React from 'react'
import Form from './Form.jsx'
import _ from 'lodash'

import FormPreview from './FormPreview.jsx'

export default class FormContainer extends React.Component {
  render() {
    const state = this.props.state
    const configuration = state.configuration
    const preview = configuration.preview
    const formElementProps = {
      controller: this.props.controller,
      state: state,
      infoElementValues: this.props.infoElementValues
    }

    var formElement

    if (preview) {
      formElement = <FormPreview {...formElementProps} />
    } else {
      formElement = <Form {...formElementProps} />
    }

    return (
      <section id="container">
        {formElement}
      </section>
    )
  }
}
