import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import HelpTooltip from 'soresu-form/web/form/component/HelpTooltip.jsx'
import MoneyTextField from 'soresu-form/web/form/component/MoneyTextField.jsx'
import Translator from 'soresu-form/web/form/Translator'
import FormUtil from 'soresu-form/web/form/FormUtil'
import VaBudgetCalculator from 'va-common/web/va/VaBudgetCalculator'

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

    const subtotals = field.subtotals
    const renderSubtotals = subtotals && subtotals.length > 1

    const selfFinancingAmountField = !_.isEmpty(this.props.children) && this.props.children[0].props.field.id === "self-financing-amount"
      ? this.props.children[0]
      : null

    const totalNeeded = this.props.field.totalNeeded

    return (
      <div id={htmlId}>
        {renderSubtotals && BudgetSubtotalSummaryElement({
          subtotals,
          totalNeeded,
          translations: this.props.translations.form.budget,
          lang: this.props.lang
        })}
        {BudgetFinancingSummaryElement({
          selfFinancingAmountField,
          totalNeeded,
          financing: this.props.field.financing,
          checkNumbersMessage: this.miscTranslator.translate("check-numbers", this.props.lang, "VIRHE"),
          translations: this.props.translations.form.budget,
          lang: this.props.lang
        })}
      </div>
    )
  }
}

const BudgetSubtotalSummaryElement = ({
  subtotals,
  totalNeeded,
  translations,
  lang
}) => {
  const subtotalRows = _.map(subtotals, st => {
    const classNames = ClassNames("money", {error: st.containsErrors})

    return (
      <tr className="budget-item" key={"total-summary-row-" + st.summingBudgetFieldId}>
        <td className="label-column" colSpan="2">
          <LocalizedString translations={st} translationKey="label" lang={lang} />
        </td>
        <td className="amount-column">
          <span className={classNames}>{st.sum}</span>
        </td>
      </tr>
    )
  })

  const totalClassNames = ClassNames("money", {error: !totalNeeded.isValid})

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
        {subtotalRows}
      </tbody>
      <tfoot>
        <tr>
          <td className="label-column" colSpan="2">
            <LocalizedString translations={translations} translationKey="financingNeededTotal" lang={lang} />
          </td>
          <td className="amount-column">
            <span className={totalClassNames}>{totalNeeded.value}</span>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

const BudgetFinancingSummaryElement = ({
  selfFinancingAmountField,
  totalNeeded,
  financing,
  checkNumbersMessage,
  translations,
  lang
}) => {
  const isFinancingResultANumber = totalNeeded.isValid && financing.isSelfValueANumber
  const isFinancingResultValid = totalNeeded.isValid && financing.isValid

  const selfFinancingPercentage = VaBudgetCalculator.percentageOf(financing.selfValue, totalNeeded.value)
  const selfFinancingPercentageFormatted = FormUtil.formatDecimal(FormUtil.roundDecimal(
    selfFinancingPercentage, 1, "floor"))
  const ophFinancingPercentageFormatted = FormUtil.formatDecimal(FormUtil.roundDecimal(
    100 - selfFinancingPercentage, 1, "ceil"))

  const minSelfFinancingClassNames = ClassNames({error: totalNeeded.isValid && !financing.isValid})
  const amountClassNames = ClassNames({
    money: isFinancingResultANumber,
    error: !isFinancingResultValid
  })
  const percentageClassNames = ClassNames({
    percentage: isFinancingResultANumber,
    error:      !isFinancingResultValid
  })

  return (
    <section className="budget-summary">
      {selfFinancingAmountField && (
        <h4 className={minSelfFinancingClassNames}>
          <LocalizedString translations={translations}
                           translationKey="minSelfFinancingNeeded"
                           keyValues={{'min-self-financing-percentage': financing.minSelfPercentage}}
                           lang={lang} />
          {totalNeeded.isValid && (
            <span> (<span className="money">{financing.minSelfValue}</span>)</span>
          )}
        </h4>
      )}
      <table className="amounts">
        <colgroup>
          <col className="amount-label-column" />
          <col className="amount-value-column" />
        </colgroup>
        <tbody>
          <tr>
            <td className="amount-label-column">
              <LocalizedString translations={translations} translationKey="selfFinancingAmount" lang={lang} />
            </td>
            <td className="amount-value-column">
              {selfFinancingAmountField || <span className={amountClassNames}>{isFinancingResultANumber ? financing.selfValue : checkNumbersMessage}</span>}
            </td>
          </tr>
          <tr>
            <td className="amount-label-column">
              <LocalizedString translations={translations} translationKey="ophFinancingAmount" lang={lang} />
            </td>
            <td className="amount-value-column">
              <span className={amountClassNames}>{isFinancingResultANumber ? financing.ophValue : checkNumbersMessage}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <table className="percentages">
        <colgroup>
          <col className="percentage-label-column" />
          <col className="percentage-value-column" />
        </colgroup>
        <tbody>
          <tr>
            <td className="percentage-label-column">
              <LocalizedString translations={translations} translationKey="selfFinancingPercentage" lang={lang} />
            </td>
            <td className="percentage-value-column">
              <span className={percentageClassNames}>{isFinancingResultANumber ? selfFinancingPercentageFormatted : checkNumbersMessage}</span>
            </td>
          </tr>
          <tr>
            <td className="percentage-label-column">
              <LocalizedString translations={translations} translationKey="ophFinancingPercentage" lang={lang} />
            </td>
            <td className="percentage-value-column">
              <span className={percentageClassNames}>{isFinancingResultANumber ? ophFinancingPercentageFormatted : checkNumbersMessage}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
