import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import Translator from '../form/Translator.js'
import {RemoveButton} from '../form/WrapperElement.jsx'
import LocalizedString from '../form/LocalizedString.jsx'
import InputValueStorage from '../form/InputValueStorage.js'

export default class VaComponentFactory {
  constructor(props) {
    this.componentTypeMapping = {
      "vaBudget": VaBudgetElement,
      "vaSummingBudgetElement": SummingBudgetElement,
      "vaBudgetItemElement": BudgetItemElement,
      "vaProjectDescription": VaProjectDescription
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

  getCustomWrapperComponentProperties(state) {
    return { "avustushaku": state.avustushaku }
  }
}


class VaBudgetElement extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    console.log('this.populateProjectBudgetTotal()', this.populateProjectBudgetTotal())
    console.log('this.props.customProps', this.props.customProps)
    return (
        <fieldset id={htmlId}>
          {children}
        </fieldset>
    )
  }

  populateProjectBudgetTotal() {
    const answersObject = this.props.answersObject
    const projectBudgetElement = this.props.children[0]
    const amountValues = _.map(projectBudgetElement.props.children, itemElement => {
      const amountCoefficient = itemElement.props.field.params.incrementsTotal ? 1 : -1
      const amountElement = itemElement.props.children[1]
      const value = InputValueStorage.readValue(null, answersObject, amountElement.props.field.id)
      return amountCoefficient * value
    })
    const sum = _.reduce(amountValues, (total, n) => { return total + n })
    projectBudgetElement.props.sum = sum
    return sum
  }
}

class SummingBudgetElement extends React.Component {
  render() {
    const field = this.props.field
    const children = this.props.children
    const sum = this.props.sum

    const htmlId = this.props.htmlId
    const columnTitles = field.params.showColumnTitles ? <thead><tr>
        <th><LocalizedString translations={field.params.columnTitles} translationKey="label" lang={this.props.lang} /></th>
        <th><LocalizedString translations={field.params.columnTitles} translationKey="description" lang={this.props.lang} /></th>
        <th><LocalizedString translations={field.params.columnTitles} translationKey="amount" lang={this.props.lang} /></th>
      </tr></thead> : undefined
    const classNames = ClassNames({"required": field.required })
    return (
        <table id={htmlId}>
          <caption className={!_.isEmpty(classNames) ? classNames : undefined}><LocalizedString translations={field} translationKey="label" lang={this.props.lang} /></caption>
          {columnTitles}
          <tbody>
            {children}
          </tbody>
          <tfoot><tr>
            <td colSpan="2"><LocalizedString translations={field.params} translationKey="sumRowLabel" lang={this.props.lang} /></td>
            <td className="money sum">{sum}</td>
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
    const descriptionComponent = children[0]
    const amountComponent = children[1]
    return (
      <tr id={htmlId}>
        <td><LocalizedString translations={field} translationKey="label" lang={this.props.lang} /></td>
        <td>{descriptionComponent}</td>
        <td className="money">{amountComponent}</td>
      </tr>
    )
  }
}

class VaProjectDescription extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    const removeButton = React.createElement(RemoveButton, this.props)
    return (
      <li className="va-big-fieldset">
        <fieldset id={htmlId}>
          <div className="fieldset-elements">
            {children}
          </div>
          <div className="fieldset-control">
            {removeButton}
          </div>
        </fieldset>
      </li>
    )
  }
}