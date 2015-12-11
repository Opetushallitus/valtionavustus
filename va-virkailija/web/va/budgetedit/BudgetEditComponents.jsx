import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory'
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

export class EditSummingBudgetElement extends React.Component {
  columnTitles(field, controller, disabled) {
    return field.params.showColumnTitles ? (
      <thead>
        <tr><th></th><th colSpan="3"><button disabled={disabled} type="button" onClick={controller.copyOriginalValues}>Kopioi haetut hyväksytyiksi</button></th></tr>
        <tr>
          <th className="label-column"><LocalizedString translations={field.params.columnTitles} translationKey="label" lang={this.props.lang} /></th>
          <th>Haettu</th>
          <th className="amount-column money required">Hyväksytty</th>
          <th className="description-column">Kommentti</th>
        </tr>
      </thead>
    ) : undefined
  }

  render() {
    const field = this.props.field
    const children = this.props.children
    const sum = field.sum
    const htmlId = this.props.htmlId
    const disabled = this.props.disabled
    const classNames = ClassNames({"required": field.required })
    const vaSpecificProperties = this.props.customProps
    const originalHakemus = vaSpecificProperties.originalHakemus
    const originalAmountValues = VaBudgetCalculator.getAmountValues(this.props.field, originalHakemus.answers)
    const originalSum = _.reduce(originalAmountValues, (total, errorsAndValue) => {return total + errorsAndValue.value}, 0)
    return (
      <table id={htmlId} className="summing-table">
        <caption className={!_.isEmpty(classNames) ? classNames : undefined}><LocalizedString translations={field} translationKey="label" lang={this.props.lang} /></caption>
        <colgroup>
          <col className="label-column" />
          <col className="original-amount-column" />
          <col className="amount-column" />
          <col className="description-column" />
        </colgroup>
        {this.columnTitles(field, this.props.controller, disabled)}
        <tbody>
          {children}
        </tbody>
        <tfoot><tr>
          <td className="label-column"><LocalizedString translations={field.params} translationKey="sumRowLabel" lang={this.props.lang} /></td>
          <td className="original-amount-column"><span className="money sum">{originalSum}</span></td>
          <td className="amount-column"><span className="money sum">{sum}</span></td>
        </tr></tfoot>
      </table>
    )
  }
}

export class EditBudgetItemElement extends React.Component {
  render() {
    const field = this.props.field
    const children = this.props.children
    const htmlId = this.props.htmlId
    const descriptionComponent = children[0]
    const amountComponent = children[1]
    const vaSpecificProperties = this.props.customProps
    const originalHakemus = vaSpecificProperties.originalHakemus
    const valueId = amountComponent.props.field.id
    const originalValue = originalHakemus ? InputValueStorage.readValue(children, originalHakemus, valueId)  : ""
    const descriptionId = descriptionComponent.props.field.id
    const originalDescription = originalHakemus ? InputValueStorage.readValue(children, originalHakemus, descriptionId)  : ""
    const labelClassName = ClassNames("label-column", { disabled: this.props.disabled })
    return (
      <tr id={htmlId} className="budget-item">
        <td className={labelClassName}>
          <LocalizedString translations={field} translationKey="label" lang={this.props.lang} />
        </td>
        <td className="original-amount-column has-title" title={originalDescription}><span className="money sum">{originalValue}</span></td>
        <td className="amount-column">{amountComponent}</td>
        <td className="description-column">{descriptionComponent}</td>
      </tr>
    )
  }
}
