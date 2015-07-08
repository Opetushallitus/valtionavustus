import React from 'react'

export default class VaComponentFactory {
  constructor(props) {
    this.componentTypeMapping = {
      "vaBudget": TotalBudgetElement
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


class TotalBudgetElement extends React.Component {
  render() {
    const field = this.props.field
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
        <fieldset id={htmlId}>
          <span>Hello from VaFieldFactory.jsx!</span>
          {children}
        </fieldset>
    )
  }
}