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
  columnTitles(field) {
    return field.params.showColumnTitles ? (
        <thead>
        <tr>
          <th className="label-column">
            <LocalizedString translations={field.params.columnTitles} translationKey="label" lang={this.props.lang}/>
          </th>
          <th className="original-amount-column">Myönnetty</th>
          <th className="amount-column money required">Seurattu</th>
          <th className="description-column">Kommentti</th>
        </tr>
        </thead>
    ) : undefined
  }

  render() {
    const {field, children, htmlId, lang, customProps} = this.props
    const sum = field.sum
    const classNames = ClassNames({"required": field.required})
    const originalHakemus = customProps.originalHakemus
    const originalAmountValues = VaBudgetCalculator.getAmountValues(field, originalHakemus.arvio["overridden-answers"])
    const originalSum = _.sum(originalAmountValues.map(x => x.value))
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
          {this.columnTitles(field)}
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
              <span className="money sum">{sum}</span>
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
    const answers = originalHakemus.arvio["overridden-answers"]
    const originalValue = originalHakemus ? InputValueStorage.readValue(children, answers, valueId) : ""
    const descriptionId = descriptionComponent.props.field.id
    const originalDescription = originalHakemus ? InputValueStorage.readValue(children, answers, descriptionId) : ""
    const labelClassName = ClassNames("label-column", {disabled: disabled})

    return (
        <tr id={htmlId} className="budget-item">
          <td className={labelClassName}>
            <LocalizedString translations={field} translationKey="label" lang={lang}/>
          </td>
          <td className="original-amount-column has-title" title={originalDescription}><span
              className="money sum">{originalValue}</span></td>
          <td className="amount-column">{amountComponent}</td>
          <td className="description-column">{descriptionComponent}</td>
        </tr>
    )
  }
}
