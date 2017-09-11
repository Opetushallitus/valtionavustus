import React from 'react'
import _ from 'lodash'

import FormPreview from './FormPreview.jsx'

export default class FormContainer extends React.Component {
  render() {
    const state = this.props.state
    const formContainerClass = this.props.formContainerClass
    const headerElements = _.get(this.props, "headerElements", "")
    const containerId = _.get(this.props, "containerId", "container")
    const formElementProps = {
      controller: this.props.controller,
      state: state,
      infoElementValues: this.props.infoElementValues
    }
    const formElement = React.createElement(formContainerClass, formElementProps)

    return (
      <section id={containerId}>
        {headerElements}
        {formElement}
      </section>
    )
  }
}
