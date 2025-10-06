import React from 'react'
import _ from 'lodash'

import BusinessIdSearch from './component/BusinessIdSearch'

export default class FormContainer extends React.Component {
  render() {
    const { state, controller, form, useBusinessIdSearch } = this.props
    const headerElements = _.get(this.props, 'headerElements', '')
    const containerId = _.get(this.props, 'containerId', 'container')
    const formElementProps = {
      controller: this.props.controller,
      state: state,
      infoElementValues: this.props.infoElementValues,
      modifyApplication: this.props.modifyApplication,
    }
    const formElement = React.createElement(form, formElementProps)
    const { embedForMuutoshakemus } = state.configuration

    if (embedForMuutoshakemus) {
      return (
        <section id={containerId} style={{ marginTop: '0px' }}>
          {formElement}
        </section>
      )
    } else {
      return (
        <section id={containerId}>
          {headerElements}
          {useBusinessIdSearch && (
            <BusinessIdSearch state={this.props.state} controller={controller} />
          )}
          {formElement}
        </section>
      )
    }
  }
}
