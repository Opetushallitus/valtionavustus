import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import HelpTooltip from 'soresu-form/web/form/component/HelpTooltip.jsx'
import Translator from 'soresu-form/web/form/Translator.js'
import FormUtil from 'soresu-form/web/form/FormUtil.js'

export default class VaBudgetElement extends React.Component {
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
    const {field,children,htmlId} = this.props
    const sum = field.sum
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
    const {field,children,htmlId} = this.props
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

    const subTotalsAndErrorsAndSummingFields = field.subTotalsAndErrorsAndSummingFields
    const renderSubTotals = subTotalsAndErrorsAndSummingFields && subTotalsAndErrorsAndSummingFields.length > 1

    const totalNeeded = this.props.field.totalNeeded

    const sumClassNames = ClassNames("money sum", { error: !field.budgetIsValid, 'error-message': !FormUtil.isNumeric(totalNeeded) })

    return (
      <div id={htmlId}>
        {renderSubTotals && BudgetSubtotalSummaryElement({
          subTotalFields: subTotalsAndErrorsAndSummingFields,
          totalNeeded,
          sumClassNames,
          translations: this.props.translations.form.budget,
          lang: this.props.lang
        })}
        {BudgetFinancingSummaryElement({
          budgetIsValid: this.props.field.budgetIsValid,
          selfFinancingPercentage: this.props.customProps.avustushaku.content["self-financing-percentage"],
          totalNeeded,
          sumClassNames,
          invalidBudgetErrorMessage: this.miscTranslator.translate("check-numbers", this.props.lang, "VIRHE"),
          translations: this.props.labelTranslations || this.props.field.params,
          lang: this.props.lang
        })}
      </div>
    )
  }
}

const BudgetSubtotalSummaryElement = ({
  subTotalFields,
  totalNeeded,
  sumClassNames,
  translations,
  lang
}) => {
  const subTotalRows = _.map(subTotalFields, row => {
    const sumTotalClassNames = ClassNames("money sum", {'error error-message': row.containsErrors})
    return (
      <tr className="budget-item" key={"total-summary-row-" + row.summingBudgetFieldId}>
        <td className="label-column" colSpan="2">
          <LocalizedString translations={row} translationKey="label" lang={lang} />
        </td>
        <td className="amount-column">
          <span className={sumTotalClassNames}>{row.sum}</span>
        </td>
      </tr>
    )
  })

  return (
    <table className="summing-table">
      <caption>
        <LocalizedString translations={translations} translationKey="financingNeeded" lang={lang} />
      </caption>
      <colgroup>
        <col className="label-column" colSpan="2"/>
        <col className="amount-column" />
      </colgroup>
      <thead>
        <tr>
          <th className="label-column" colSpan="2">
            <LocalizedString translations={translations} translationKey="financingSection" lang={lang} />
          </th>
          <th className="amount-column">
            <LocalizedString translations={translations} translationKey="total" lang={lang} />
          </th>
        </tr>
      </thead>
      <tbody>
        {subTotalRows}
      </tbody>
      <tfoot>
        <tr>
          <td className="label-column" colSpan="2">
            <LocalizedString translations={translations} translationKey="financingNeededTotal" lang={lang} />
          </td>
          <td className="amount-column">
            <span className={sumClassNames}>{totalNeeded}</span>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

const BudgetFinancingSummaryElement = ({
  budgetIsValid,
  selfFinancingPercentage,
  totalNeeded,
  sumClassNames,
  invalidBudgetErrorMessage,
  translations,
  lang
}) => {
  const selfFinancingShare = budgetIsValid ? Math.ceil((selfFinancingPercentage / 100) * totalNeeded) : invalidBudgetErrorMessage
  const ophFinancingShare = budgetIsValid ? (totalNeeded - selfFinancingShare) : invalidBudgetErrorMessage
  const sumPartClassNames = ClassNames("money sum", {'error error-message': !budgetIsValid})

  return (
    <table className="budget-summary">
      <colgroup>
        <col className="label-column" />
        <col className="amount-column" />
      </colgroup>
      <tbody>
      <tr className="grand-total">
        <td className="label-column"><LocalizedString translations={translations} translationKey="totalSumRowLabel" lang={lang} /></td>
        <td className="amount-column"><span className={sumClassNames}>{totalNeeded}</span></td>
      </tr>
      <tr hidden={selfFinancingPercentage === 0}>
        <td className="label-column"><LocalizedString translations={translations} translationKey="ophFinancingLabel" lang={lang} /> {100 - selfFinancingPercentage} %</td>
        <td className="amount-column"><span className={sumPartClassNames}>{ophFinancingShare}</span></td>
      </tr>
      <tr hidden={selfFinancingPercentage === 0}>
        <td className="label-column"><LocalizedString translations={translations} translationKey="selfFinancingLabel" lang={lang} /> {selfFinancingPercentage} %</td>
        <td className="amount-column"><span className={sumPartClassNames}>{selfFinancingShare}</span></td>
      </tr>
      </tbody>
    </table>
  )
}
