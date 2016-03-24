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

export default class BudgetEditElement extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {children, htmlId} = this.props
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
class ToggleKonttaSumma extends React.Component {
  render() {
    const {controller, disabled, useDetailedCosts} = this.props
    const statuses = _.flatten([
      {useDetailedCosts: false, text: 'Kokonaiskustannukset'},
      {useDetailedCosts: true, text: 'Menokohtainen erittely'}].map(obj => {
      const htmlId = "useDetailedCosts-" + obj.useDetailedCosts
      const onChange = !disabled ? controller.toggleDetailedCostsListener : null
      return [
        <input id={htmlId}
               type="radio"
               key={htmlId}
               name="useDetailedCosts"
               value={obj.useDetailedCosts}
               disabled={disabled}
               onChange={onChange}
               checked={obj.useDetailedCosts === useDetailedCosts ? true: null}
        />,
        <label key={htmlId + "-label"} htmlFor={htmlId}>{obj.text}</label>
      ]
    }))
    return (
        <div className="value-edit">
          {statuses}
        </div>
    )
  }
}

export class EditSummingBudgetElement extends React.Component {
  columnTitles(field, controller, disabled, useDetailedCosts) {
    return field.params.showColumnTitles ? (
        <thead>
        <tr hidden={disabled}>
          <th colSpan="4">
            <ToggleKonttaSumma controller={controller} disabled={disabled} useDetailedCosts={useDetailedCosts}/>
          </th>
        </tr>
        <tr>
          <th className="label-column">
            <LocalizedString translations={field.params.columnTitles} translationKey="label" lang={this.props.lang}/>
          </th>
          <th className="original-amount-column">Haettu</th>
          <th className="amount-column money required">Hyväksytty</th>
          <th className="description-column">Kommentti</th>
        </tr>
        </thead>
    ) : undefined
  }

  render() {
    const {field, children, htmlId, controller, lang, customProps} = this.props
    const sum = field.sum
    const disabled = this.props.disabled || typeof this.props.disabled === 'undefined'
    const classNames = ClassNames({"required": field.required})
    const originalHakemus = customProps.originalHakemus
    const originalAmountValues = VaBudgetCalculator.getAmountValues(field, originalHakemus.answers)
    const originalSum = _.reduce(originalAmountValues, (total, errorsAndValue) => {
      return total + errorsAndValue.value
    }, 0)
    const useDetailedCosts = _.get(originalHakemus, 'arvio.useDetailedCosts', false)
    const costsGranted = _.get(originalHakemus, 'arvio.costsGranted', 0)
    const firstTable = field.params.showColumnTitles
    return (
        <table id={htmlId} className="summing-table">
          <caption className={!_.isEmpty(classNames) ? classNames : undefined}>
            <LocalizedString translations={field} translationKey="label" lang={lang}/>
          </caption>
          <colgroup>
            <col className="label-column"/>
            <col className="original-amount-column"/>
            <col className="amount-column"/>
            <col className="description-column"/>
          </colgroup>
          {this.columnTitles(field, controller, disabled, useDetailedCosts)}
          <tbody>
          {children}
          </tbody>
          <tfoot>
          <tr>
            <td className="label-column">
              <LocalizedString translations={field.params} translationKey="sumRowLabel" lang={lang}/>
            </td>
            <td className="original-amount-column"><span className="money sum">{originalSum}</span></td>
            <td className="amount-column">
              {useDetailedCosts || !firstTable ?
                  <span className="money sum">{sum}</span> :
                  <div className="soresu-money-field extra-extra-small">
                    <input type="text" className="extra-extra-small" value={costsGranted}
                           onChange={controller.costsGrantedOnChangeListener}/>
                  </div>}
            </td>
          </tr>
          </tfoot>
        </table>
    )
  }
}

export class EditBudgetItemElement extends React.Component {
  render() {
    const {field, children,htmlId, disabled, lang, customProps} = this.props
    const descriptionComponent = children[0]
    const amountComponent = children[1]
    const originalHakemus = customProps.originalHakemus
    const valueId = amountComponent.props.field.id
    const originalValue = originalHakemus ? InputValueStorage.readValue(children, originalHakemus, valueId) : ""
    const descriptionId = descriptionComponent.props.field.id
    const originalDescription = originalHakemus ? InputValueStorage.readValue(children, originalHakemus, descriptionId) : ""
    const labelClassName = ClassNames("label-column", {disabled: disabled})
    const useDetailedCosts = _.get(originalHakemus, 'arvio.useDetailedCosts', false)
    const firstTable = field.params.incrementsTotal
    const allowEditing = useDetailedCosts || !firstTable
    return (
        <tr id={htmlId} className="budget-item">
          <td className={labelClassName}>
            <LocalizedString translations={field} translationKey="label" lang={lang}/>
          </td>
          <td className="original-amount-column has-title" title={originalDescription}><span
              className="money sum">{originalValue}</span></td>
          <td className="amount-column">{allowEditing && amountComponent}</td>
          <td className="description-column">{allowEditing && descriptionComponent}</td>
        </tr>
    )
  }
}
