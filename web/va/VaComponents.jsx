import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import Translator from '../form/Translator.js'
import RemoveButton from '../form/element/RemoveButton.jsx'
import LocalizedString from '../form/element/LocalizedString.jsx'
import InputValueStorage from '../form/InputValueStorage.js'

export default class VaComponentFactory {
  constructor(props) {
    this.componentTypeMapping = {
      "vaBudget": VaBudgetElement,
      "vaSummingBudgetElement": SummingBudgetElement,
      "vaBudgetItemElement": BudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement,
      "vaProjectDescription": VaProjectDescription
    }
  }

  createComponent(componentProps) {
    const field = componentProps.field;
    const displayAs = field.displayAs
    const model = componentProps.model

    var element = <span>{this.constructor.name} : Unsupported field type {displayAs}</span>

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
  constructor(props) {
    super(props)
    this.miscTranslator = new Translator(this.props.translations["misc"])
  }
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId

    const summingElementChildren = _.filter(this.props.children, child => { return child.props.field.displayAs === "vaSummingBudgetElement" })
    const subTotalsAndErrors = _.map(summingElementChildren, this.populateSummingElementSum(this.props.answersObject))
    const total = _.reduce(subTotalsAndErrors, (acc, errorFlagAndSum) => { return acc + errorFlagAndSum.sum }, 0)
    const someFigureHasError = _.some(subTotalsAndErrors, (errorFlagAndSum) => { return errorFlagAndSum.containsErrors })
    const summaryElement = _.last(children)
    summaryElement.props.totalNeeded = someFigureHasError ? this.miscTranslator.translate("check-numbers", this.props.lang, "VIRHE") : total
    return (
        <fieldset id={htmlId}>
          {children}
        </fieldset>
    )
  }

  populateSummingElementSum(answersObject) {
    return function(summingBudgetElement) {
      const amountValues = _.map(summingBudgetElement.props.children, itemElement => {
        const amountCoefficient = itemElement.props.field.params.incrementsTotal ? 1 : -1
        const amountElement = itemElement.props.children[1]
        const errorsOfElement = amountElement.props.validationErrors
        const value = _.isEmpty(errorsOfElement) ?
          InputValueStorage.readValue(null, answersObject, amountElement.props.field.id) :
          0
        return { "containsErrors": !_.isEmpty(errorsOfElement), "value": amountCoefficient * value }
      })
      const sum = _.reduce(amountValues, (total, errorsAndValue) => { return total + errorsAndValue.value }, 0)
      const containsErrors = _.some(amountValues, (errorsAndValue) => { return errorsAndValue.containsErrors })
      summingBudgetElement.props.sum = sum
      return { "containsErrors": containsErrors, "sum": sum}
    }
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

class BudgetSummaryElement extends React.Component {
  render() {
    function isNumeric(n) { // TODO reuse from FormModel
      return !isNaN(parseFloat(n)) && isFinite(n)
    }

    const htmlId = this.props.htmlId
    const field = this.props.field

    const vaSpecificProperties = this.props.customProps
    const avustushaku = vaSpecificProperties.avustushaku
    const selfFinancingPercentage = avustushaku.content["self-financing-percentage"]

    const totalNeeded = this.props.totalNeeded
    const figuresAreValid = isNumeric(totalNeeded);
    const selfFinancingShare = figuresAreValid ? Math.ceil((selfFinancingPercentage / 100) * totalNeeded) : totalNeeded
    const ophShare = figuresAreValid ? (totalNeeded - selfFinancingShare) : totalNeeded
    const sumClassNames = ClassNames("money sum", figuresAreValid ? undefined : "error")
    return (
      <table id={htmlId}>
        <tbody>
          <tr>
            <td colSpan="2"><LocalizedString translations={field.params} translationKey="totalSumRowLabel" lang={this.props.lang} /></td>
            <td className={sumClassNames}>{totalNeeded}</td>
          </tr>
          <tr>
            <td colSpan="2"><LocalizedString translations={field.params} translationKey="ophFinancingLabel" lang={this.props.lang} /> {100 - selfFinancingPercentage} %</td>
            <td className={sumClassNames}>{ophShare}</td>
          </tr>
          <tr>
            <td colSpan="2"><LocalizedString translations={field.params} translationKey="selfFinancingLabel" lang={this.props.lang} /> {selfFinancingPercentage} %</td>
            <td className={sumClassNames}>{selfFinancingShare}</td>
          </tr>
        </tbody>
      </table>
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