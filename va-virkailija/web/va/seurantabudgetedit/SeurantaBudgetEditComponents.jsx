import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'

import VaBudgetCalculator from 'va-common/web/va/VaBudgetCalculator'

export class EditSummingBudgetElement extends React.Component {
  render() {
    const {field, children, htmlId, lang, controller, customProps} = this.props
    const sum = field.sum
    const classNames = ClassNames({"required": field.required})
    const grantedSum = EditSummingBudgetElement.getGrantedSum(
      field,
      customProps.originalHakemus.arvio,
      controller.budgetBusinessRules.showDetailedCostsForBudgetField(field))
    const valiselvitysSum = EditSummingBudgetElement.getSelvitysSum(field, _.get(customProps.originalHakemus, "selvitys.valiselvitys", []))
    const loppuselvitysSum = EditSummingBudgetElement.getSelvitysSum(field, _.get(customProps.originalHakemus, "selvitys.loppuselvitys", []))
    const visibleColumns = {
      grantedSum: grantedSum.isVisible,
      valiselvitysSum: valiselvitysSum.isVisible,
      loppuselvitysSum: loppuselvitysSum.isVisible
    }

    return (
      <table id={htmlId} className="summing-table">
        <caption className={!_.isEmpty(classNames) ? classNames : undefined}>
          <LocalizedString translations={field} translationKey="label" lang={lang}/>
        </caption>
        <colgroup>
          <col className="label-column"/>
          {visibleColumns.grantedSum       && <col className="granted-amount-column"/>}
          {visibleColumns.valiselvitysSum  && <col className="valiselvitys-amount-column"/>}
          {visibleColumns.loppuselvitysSum && <col className="loppuselvitys-amount-column"/>}
          <col className="amount-column"/>
          <col className="description-column"/>
        </colgroup>
        {EditSummingBudgetElement.columnTitles(field, lang, visibleColumns)}
        <tbody>
        {children}
        </tbody>
        <tfoot>
        <tr>
          <td className="label-column">
            <LocalizedString translations={field.params} translationKey="sumRowLabel" lang={lang}/>
          </td>
          {visibleColumns.grantedSum       && <td className="granted-amount-column"><span className="money">{grantedSum.sum}</span></td>}
          {visibleColumns.valiselvitysSum  && <td className="valiselvitys-amount-column"><span className="money">{valiselvitysSum.sum}</span></td>}
          {visibleColumns.loppuselvitysSum && <td className="loppuselvitys-amount-column"><span className="money">{loppuselvitysSum.sum}</span></td>}
          <td className="amount-column">
            <span className="money sum">{sum}</span>
          </td>
        </tr>
        </tfoot>
      </table>
    )
  }

  static columnTitles(field, lang, visibleColumns) {
    return field.params.showColumnTitles && (
      <thead>
      <tr>
        <th className="label-column">
          <LocalizedString translations={field.params.columnTitles} translationKey="label" lang={lang}/>
        </th>
        {visibleColumns.grantedSum       && <th className="granted-amount-column">Myön&shy;netty</th>}
        {visibleColumns.valiselvitysSum  && <th className="valiselvitys-amount-column money">Väli&shy;selvitys</th>}
        {visibleColumns.loppuselvitysSum && <th className="loppuselvitys-amount-column money">Loppu&shy;selvitys</th>}
        <th className="amount-column money required" style={{textAlign:'center'}}>OPH:n hyväksymä</th>
        <th className="description-column">Kommentti</th>
      </tr>
      </thead>
    )
  }

  static getGrantedSum(field, arvio, showDetailedCosts) {
    if (!showDetailedCosts) {
      return {
        isVisible: true,
        sum: arvio.costsGranted
      }
    }

    const answers = arvio["overridden-answers"]

    if (_.isEmpty(answers)) {
      return {isVisible: false}
    }

    return {
      isVisible: true,
      sum: EditSummingBudgetElement.sumOf(field, answers)
    }
  }

  static getSelvitysSum(field, answers) {
    if (_.isEmpty(answers)) {
      return {isVisible: false}
    }

    return {
      isVisible: true,
      sum: EditSummingBudgetElement.sumOf(field, answers)
    }
  }

  static sumOf(field, answers) {
    return _.sum(VaBudgetCalculator.getAmountValues(field, answers).map(x => x.value))
  }
}

export class EditBudgetItemElement extends React.Component {
  render() {
    const {field, children, htmlId, disabled, lang, controller, customProps} = this.props
    const descriptionComponent = children[0]
    const descriptionId = descriptionComponent.props.field.id
    const valueComponent = children[1]
    const valueId = valueComponent.props.field.id

    const labelClassName = ClassNames("label-column", {disabled: disabled})

    const showDetailedCosts = controller.budgetBusinessRules.showDetailedCostsForBudgetField(field)

    const grantedAnswers = customProps.originalHakemus.arvio["overridden-answers"]
    const valiselvitysAnswers = _.get(customProps.originalHakemus, "selvitys.valiselvitys", [])
    const loppuselvitysAnswers = _.get(customProps.originalHakemus, "selvitys.loppuselvitys", [])

    return (
      <tr id={htmlId} className="budget-item">
        <td className={labelClassName}>
          <LocalizedString translations={field} translationKey="label" lang={lang}/>
        </td>
        {(!showDetailedCosts || !_.isEmpty(grantedAnswers)) && <GrantedAmountCell answers={grantedAnswers} valueId={valueId} descriptionId={descriptionId} showContents={showDetailedCosts}/>}
        {!_.isEmpty(valiselvitysAnswers)                    && <SelvitysAmountCell answers={valiselvitysAnswers} valueId={valueId} descriptionId={descriptionId} cellClassName="valiselvitys-amount-column"/>}
        {!_.isEmpty(loppuselvitysAnswers)                   && <SelvitysAmountCell answers={loppuselvitysAnswers} valueId={valueId} descriptionId={descriptionId} cellClassName="loppuselvitys-amount-column"/>}
        <td className="amount-column">{valueComponent}</td>
        <td className="description-column">{descriptionComponent}</td>
      </tr>
    )
  }
}

class EditBudgetItemCell extends React.Component {
  amountOf(answers, valueId, descriptionId) {
    const value = InputValueStorage.readValue(null, answers, valueId)
    const hasValidValue = !!value
    const description = hasValidValue
      ? InputValueStorage.readValue(null, answers, descriptionId)
      : 'Budjettirivin arvoa ei löytynyt.'

    return {
      hasValidValue: hasValidValue,
      valueFormatted: hasValidValue ? value : '–',
      hasDescription: !_.isEmpty(description),
      description: description
    }
  }
}

class GrantedAmountCell extends EditBudgetItemCell {
  render() {
    const {answers, valueId, descriptionId, showContents} = this.props

    const amount = showContents
      ? this.amountOf(answers, valueId, descriptionId)
      : {description: ""}

    const cellClassNames = ClassNames("granted-amount-column", {'has-title': amount.hasDescription})

    let contents = null

    if (showContents) {
      const moneyClassNames = ClassNames("money sum", {error: !amount.hasValidValue})
      contents = <span className={moneyClassNames}>{amount.valueFormatted}</span>
    }

    return <td className={cellClassNames} title={amount.description}>{contents}</td>
  }
}

class SelvitysAmountCell extends EditBudgetItemCell {
  render() {
    const {answers, valueId, descriptionId, cellClassName} = this.props

    const amount = this.amountOf(answers, valueId, descriptionId)
    const cellClassNames = ClassNames(cellClassName, {'has-title': amount.hasDescription})
    const moneyClassNames = ClassNames("money", {'error error-message': !amount.hasValidValue})

    return (
      <td className={cellClassNames} title={amount.description}>
        <span className={moneyClassNames}>{amount.valueFormatted}</span>
      </td>
    )
  }
}
