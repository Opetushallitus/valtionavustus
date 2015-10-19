import React from 'react'
import Form from './Form.jsx'
import _ from 'lodash'

import FormPreview from './FormPreview.jsx'

export default class FormContainer extends React.Component {
  render() {
    const state = this.props.state
    const configuration = state.configuration
    const preview = configuration.preview
    const headerElements = _.get(this.props, "headerElements", "")
    const formElementProps = {
      controller: this.props.controller,
      state: state,
      infoElementValues: this.props.infoElementValues
    }

    return (
      <section id="container">
        {headerElements}
        {this.formElement(preview, formElementProps)}
      </section>
    )
  }

  formElement(preview, formElementProps) {
    if (preview) {
      return <FormPreview {...formElementProps} />
    } else {
      return <Form {...formElementProps} />
    }
  }
}
