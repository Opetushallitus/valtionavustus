import React from "react"
import _ from "lodash"

import BusinessIdSearch from "./component/BusinessIdSearch.jsx"

export default class FormContainer extends React.Component {
  render() {
    const {state, controller, formContainerClass, useBusinessIdSearch} = this.props
    const headerElements = _.get(this.props, "headerElements", "")
    const containerId = _.get(this.props, "containerId", "container")
    const formElementProps = {
      controller: this.props.controller,
      state: state,
      infoElementValues: this.props.infoElementValues
    }
    const formElement = React.createElement(formContainerClass, formElementProps)

    return (
      <section id={containerId} >
        {headerElements}
        {useBusinessIdSearch && <BusinessIdSearch state={this.props.state} controller={controller}/>}
        {formElement}
      </section>
    )
  }
}
