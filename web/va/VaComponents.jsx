import React from 'react'

import LocalizedString from '../form/LocalizedString.jsx'

export default class VaComponentFactory {
  constructor(props) {
    this.componentTypeMapping = {
      "vaBudget": VaBudgetElement
    }
  }

 createComponent(componentProps) {
    const field = componentProps.field;
    const displayAs = field.displayAs
    const model = componentProps.model

    var element = <span>VaComponentFactory: Unsupported field type {displayAs}</span>

    if (displayAs in this.componentTypeMapping) {
      element = React.createElement(this.componentTypeMapping[displayAs], componentProps)
    }
    return element
  }
}


class VaBudgetElement extends React.Component {
  render() {
    const field = this.props.field
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
        <fieldset id={htmlId}>
          <label htmlFor={this.props.htmlId} className={field.required ? "required" : ""}><LocalizedString translations={field} translationKey="label" lang={this.props.lang} /></label>
          <span>Hello from VaFieldFactory.jsx!</span>
          {children}
        </fieldset>
    )
  }
}