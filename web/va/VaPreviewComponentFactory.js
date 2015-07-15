import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import ComponentFactory from '../form/ComponentFactory.js'
import {VaBudgetElement, SummingBudgetElement, BudgetItemElement, BudgetSummaryElement} from './VaBudgetComponents.jsx'

export default class VaPreviewComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": VaPreviewBudgetElement,
      "vaSummingBudgetElement": SummingBudgetElement,
      "vaBudgetItemElement": BudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement,
      "vaProjectDescription": VaProjectDescriptionPreview
    }
    super(fieldTypeMapping)
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