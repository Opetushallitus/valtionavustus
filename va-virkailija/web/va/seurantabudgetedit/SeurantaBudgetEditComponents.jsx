import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory'
import MoneyTextField from 'soresu-form/web/form/component/MoneyTextField.jsx'
import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import HelpTooltip from 'soresu-form/web/form/component/HelpTooltip.jsx'
import Translator from 'soresu-form/web/form/Translator'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import FormUtil from 'soresu-form/web/form/FormUtil'
import JsUtil from 'soresu-form/web/form/JsUtil'

import VaBudgetCalculator from 'va-common/web/va/VaBudgetCalculator'

export class EditSummingBudgetElement extends React.Component {
  render() {
    const {field, children, htmlId, lang, customProps} = this.props
    const sum = field.sum
    const classNames = ClassNames({"required": field.required})
    const grantedSum = EditSummingBudgetElement.sumOf(field, customProps.originalHakemus.arvio["overridden-answers"])
    const valiselvitysSum = EditSummingBudgetElement.sumOf(field, _.get(customProps.originalHakemus, "selvitys.valiselvitys", []))
    const loppuselvitysSum = EditSummingBudgetElement.sumOf(field, _.get(customProps.originalHakemus, "selvitys.loppuselvitys", []))
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
            {grantedSum.isVisible && (<col className="granted-amount-column"/>)}
            {valiselvitysSum.isVisible && (<col className="valiselvitys-amount-column"/>)}
            {loppuselvitysSum.isVisible && (<col className="loppuselvitys-amount-column"/>)}
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
            {grantedSum.isVisible && (<td className="granted-amount-column"><span className="money sum">{grantedSum.value}</span></td>)}
            {valiselvitysSum.isVisible && (<td className="valiselvitys-amount-column"><span className="money sum">{valiselvitysSum.value}</span></td>)}
            {loppuselvitysSum.isVisible && (<td className="loppuselvitys-amount-column"><span className="money sum">{loppuselvitysSum.value}</span></td>)}
            <td className="amount-column">
              <span className="money sum">{sum}</span>
            </td>
          </tr>
          </tfoot>
        </table>
    )
  }

  static columnTitles(field, lang, visibleColumns) {
    return field.params.showColumnTitles ? (
        <thead>
        <tr>
          <th className="label-column">
            <LocalizedString translations={field.params.columnTitles} translationKey="label" lang={lang}/>
          </th>
          {visibleColumns.grantedSum && (<th className="granted-amount-column">Myön&shy;netty</th>)}
          {visibleColumns.valiselvitysSum && (<th className="valiselvitys-amount-column money">Väli&shy;selvitys</th>)}
          {visibleColumns.loppuselvitysSum && (<th className="loppuselvitys-amount-column money">Loppu&shy;selvitys</th>)}
          <th className="amount-column money required" style={{textAlign:'center'}}>OPH:n hyväksymä</th>
          <th className="description-column">Kommentti</th>
        </tr>
        </thead>
    ) : undefined
  }

  static sumOf(field, answers) {
    return _.isEmpty(answers)
      ? {isVisible: false}
      : {
          isVisible: true,
          value: _.sum(VaBudgetCalculator.getAmountValues(field, answers).map(x => x.value))
        }
  }
}

export class EditBudgetItemElement extends React.Component {
  render() {
    const {field, children, htmlId, disabled, lang, customProps} = this.props
    const descriptionComponent = children[0]
    const descriptionId = descriptionComponent.props.field.id
    const valueComponent = children[1]
    const valueId = valueComponent.props.field.id

    const labelClassName = ClassNames("label-column", {disabled: disabled})

    const grantedAmount = EditBudgetItemElement.amountOf(customProps.originalHakemus.arvio["overridden-answers"], valueId, descriptionId)
    const grantedCellClassNames = ClassNames("granted-amount-column", {'has-title': grantedAmount.hasDescription})
    const grantedMoneyClassNames = ClassNames("money sum", {'error error-message': !grantedAmount.hasValidValue})

    const valiselvitysAmount = EditBudgetItemElement.amountOf(_.get(customProps.originalHakemus, "selvitys.valiselvitys", []), valueId, descriptionId)
    const valiselvitysCellClassNames = ClassNames("valiselvitys-amount-column", {'has-title': valiselvitysAmount.hasDescription})
    const valiselvitysMoneyClassNames = ClassNames("money sum", {'error error-message': !valiselvitysAmount.hasValidValue})

    const loppuselvitysAmount = EditBudgetItemElement.amountOf(_.get(customProps.originalHakemus, "selvitys.loppuselvitys", []), valueId, descriptionId)
    const loppuselvitysCellClassNames = ClassNames("loppuselvitys-amount-column", {'has-title': loppuselvitysAmount.hasDescription})
    const loppuselvitysMoneyClassNames = ClassNames("money sum", {'error error-message': !loppuselvitysAmount.hasValidValue})

    return (
        <tr id={htmlId} className="budget-item">
          <td className={labelClassName}>
            <LocalizedString translations={field} translationKey="label" lang={lang}/>
          </td>
          {grantedAmount.isVisible && (
            <td className={grantedCellClassNames} title={grantedAmount.description}>
              <span className={grantedMoneyClassNames}>{grantedAmount.valueFormatted}</span>
            </td>
          )}
          {valiselvitysAmount.isVisible && (
            <td className={valiselvitysCellClassNames} title={valiselvitysAmount.description}>
              <span className={valiselvitysMoneyClassNames}>{valiselvitysAmount.valueFormatted}</span>
            </td>
          )}
          {loppuselvitysAmount.isVisible && (
            <td className={loppuselvitysCellClassNames} title={loppuselvitysAmount.description}>
              <span className={loppuselvitysMoneyClassNames}>{loppuselvitysAmount.valueFormatted}</span>
            </td>
          )}
          <td className="amount-column">{valueComponent}</td>
          <td className="description-column">{descriptionComponent}</td>
        </tr>
    )
  }

  static amountOf(answers, valueId, descriptionId) {
    if (_.isEmpty(answers)) {
      return {isVisible: false}
    }

    const value = InputValueStorage.readValue(null, answers, valueId)
    const hasValidValue = !!value
    const description = hasValidValue
          ? InputValueStorage.readValue(null, answers, descriptionId)
          : 'Budgettirivin arvoa ei löytynyt.'

    return {
      isVisible: true,
      hasValidValue: hasValidValue,
      valueFormatted: hasValidValue ? value : '–',
      hasDescription: !_.isEmpty(description),
      description: description
    }
  }
}
