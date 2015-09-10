import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import ComponentFactory from '../form/ComponentFactory.js'
import LocalizedString from '../form/component/LocalizedString.jsx'
import HelpTooltip from '../form/component/HelpTooltip.jsx'
import Translator from '../form/Translator.js'
import InputValueStorage from '../form/InputValueStorage.js'
import FormUtil from '../form/FormUtil.js'
import JsUtil from '../form/JsUtil.js'

export class VaBudgetElement extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId

    return this.html(htmlId, children)
  }

  html(htmlId, children) {
    return (
      <fieldset className="va-budget" id={htmlId}>
        {children}
      </fieldset>
    )
  }
}

export class SummingBudgetElement extends React.Component {
  columnTitles(field) {
    if (field.params.showColumnTitles) {
      return (
        <thead><tr>
          <th className="label-column"><LocalizedString translations={field.params.columnTitles} translationKey="label" lang={this.props.lang} /></th>
          <th><LocalizedString translations={field.params.columnTitles} translationKey="description" lang={this.props.lang} /></th>
          <th className="amount-column"><LocalizedString className="money required" translations={field.params.columnTitles} translationKey="amount" lang={this.props.lang} /></th>
        </tr></thead>
      )
    }
    return undefined
  }

  render() {
    const field = this.props.field
    const children = this.props.children
    const sum = field.sum
    const htmlId = this.props.htmlId
    const classNames = ClassNames({"required": field.required })
    return (
      <table id={htmlId} className="summing-table">
        <caption className={!_.isEmpty(classNames) ? classNames : undefined}><LocalizedString translations={field} translationKey="label" lang={this.props.lang} /></caption>
        <colgroup>
          <col className="label-column" />
          <col className="description-column" />
          <col className="amount-column" />
        </colgroup>
        {this.columnTitles(field)}
        <tbody>
        {children}
        </tbody>
        <tfoot><tr>
          <td className="label-column" colSpan="2"><LocalizedString translations={field.params} translationKey="sumRowLabel" lang={this.props.lang} /></td>
          <td className="amount-column"><span className="money sum">{sum}</span></td>
        </tr></tfoot>
      </table>
    )
  }
}

export class BudgetItemElement extends React.Component {
  constructor(props) {
    super(props)
    this._bind('helpText')
  }

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this))
  }

  helpText() {
    if (this.props.field.helpText) {
      return <HelpTooltip content={this.props.field.helpText} lang={this.props.lang}/>
    }
    return undefined
  }

  render() {
    const field = this.props.field
    const children = this.props.children
    const htmlId = this.props.htmlId
    const descriptionComponent = children[0]
    const amountComponent = children[1]
    const labelClassName = ClassNames("label-column", { disabled: this.props.disabled })
    return (
      <tr id={htmlId} className="budget-item">
        <td className={labelClassName}>
          <LocalizedString translations={field} translationKey="label" lang={this.props.lang} />
          {this.helpText()}
        </td>
        <td>{descriptionComponent}</td>
        <td className="amount-column">{amountComponent}</td>
      </tr>
    )
  }
}

export class BudgetSummaryElement extends React.Component {
  constructor(props) {
    super(props)
    this.miscTranslator = new Translator(props.translations["misc"])
  }

  render() {
    const htmlId = this.props.htmlId
    const field = this.props.field

    const vaSpecificProperties = this.props.customProps
    const avustushaku = vaSpecificProperties.avustushaku
    const selfFinancingPercentage = avustushaku.content["self-financing-percentage"]

    const totalNeeded = field.totalNeeded
    const errorMessage = this.miscTranslator.translate("check-numbers", this.props.lang, "VIRHE")

    const selfFinancingShare = field.budgetIsValid ? Math.ceil((selfFinancingPercentage / 100) * totalNeeded) : errorMessage
    const ophShare = field.budgetIsValid ? (totalNeeded - selfFinancingShare) : errorMessage
    const sumClassNames = ClassNames("money sum", { error: !field.budgetIsValid, 'error-message': !FormUtil.isNumeric(totalNeeded) })
    const sumPartClassNames = ClassNames("money sum", { 'error error-message': !field.budgetIsValid  })
    return (
      <table id={htmlId} className="budget-summary">
        <colgroup>
          <col className="label-column" />
          <col className="amount-column" />
        </colgroup>
        <tbody>
        <tr className="grand-total">
          <td className="label-column"><LocalizedString translations={field.params} translationKey="totalSumRowLabel" lang={this.props.lang} /></td>
          <td className="amount-column"><span className={sumClassNames}>{totalNeeded}</span></td>
        </tr>
        <tr>
          <td className="label-column"><LocalizedString translations={field.params} translationKey="ophFinancingLabel" lang={this.props.lang} /> {100 - selfFinancingPercentage} %</td>
          <td className="amount-column"><span className={sumPartClassNames}>{ophShare}</span></td>
        </tr>
        <tr>
          <td className="label-column"><LocalizedString translations={field.params} translationKey="selfFinancingLabel" lang={this.props.lang} /> {selfFinancingPercentage} %</td>
          <td className="amount-column"><span className={sumPartClassNames}>{selfFinancingShare}</span></td>
        </tr>
        </tbody>
      </table>
    )
  }
}
