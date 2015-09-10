import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import ComponentFactory from '../form/ComponentFactory.js'
import LocalizedString from '../form/component/LocalizedString.jsx'
import {VaBudgetElement, SummingBudgetElement, BudgetItemElement, BudgetSummaryElement} from './VaBudgetComponents.jsx'

export default class VaPreviewComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": VaPreviewBudgetElement,
      "vaSummingBudgetElement": SummingBudgetElement,
      "vaBudgetItemElement": VaPreviewBudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement,
      "vaProjectDescription": VaProjectDescriptionPreview
    }
    super(fieldTypeMapping)
  }
}

class VaPreviewBudgetItemElement extends React.Component {
  render() {
    const field = this.props.field
    const children = this.props.children
    const htmlId = this.props.htmlId
    const descriptionComponent = children[0]
    const amountComponent = children[1]
    return (
      <tr id={htmlId} className="budget-item">
        <td className="label-column">
          <LocalizedString translations={field} translationKey="label" lang={this.props.lang} />
        </td>
        <td>{descriptionComponent}</td>
        <td className="amount-column">{amountComponent}</td>
      </tr>
    )
  }
}


class VaPreviewBudgetElement extends VaBudgetElement {
  html(htmlId, children) {
    return (<div className="va-budget" id={htmlId}>
             {children}
            </div>)
  }}

class VaProjectDescriptionPreview extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    const classNames = ClassNames("va-big-fieldset", {hidden: this.isHidden()})
    return (
      <li className={classNames} id={htmlId}>
        <div className="fieldset-elements">
          {children}
        </div>
      </li>
    )
  }

  isHidden() {
    return this.props.renderingParameters && this.props.renderingParameters.valueIsEmpty === true;
  }
}