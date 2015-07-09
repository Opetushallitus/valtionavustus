import React from 'react'

import LocalizedString from '../form/LocalizedString.jsx'

export default class VaComponentFactory {
  constructor(props) {
    this.componentTypeMapping = {
      "vaBudget": VaBudgetElement,
      "vaSummingBudgetElement": SummingBudgetElement,
      "vaBudgetItemElement": BudgetItemElement
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
          {children}
        </fieldset>
    )
  }
}

class SummingBudgetElement extends React.Component {
  render() {
    const field = this.props.field
    const children = this.props.children
    const htmlId = this.props.htmlId
    const columnTitles = field.params.showColumnTitles ? <thead><tr>
        <th><LocalizedString translations={field.params.columnTitles} translationKey="label" lang={this.props.lang} /></th>
        <th><LocalizedString translations={field.params.columnTitles} translationKey="description" lang={this.props.lang} /></th>
        <th><LocalizedString translations={field.params.columnTitles} translationKey="amount" lang={this.props.lang} /></th>
      </tr></thead> : ""
    return (
        <table id={htmlId}>
          <caption className={field.required ? "required" : ""}><LocalizedString translations={field} translationKey="label" lang={this.props.lang} /></caption>
          {columnTitles}
          <tbody>
            {children}
          </tbody>
          <tfoot><tr>
            <td colSpan="2"><LocalizedString translations={field.params} translationKey="sumRowLabel" lang={this.props.lang} /></td>
            <td>TODO: sum here</td>
          </tr></tfoot>
        </table>
    )
  }
}

class BudgetItemElement extends React.Component {
  render() {
    const field = this.props.field
    const children = this.props.children
    const htmlId = this.props.htmlId
    const incrementsTotal = field.params.incrementsTotal
    const descriptionComponent = children[0]
    const amountComponent = children[1]
    return (
      <tr id={htmlId}>
        <td><LocalizedString translations={field} translationKey="label" lang={this.props.lang} /></td>
        <td>{descriptionComponent}</td>
        <td>{amountComponent}</td>
      </tr>
    )
  }
}