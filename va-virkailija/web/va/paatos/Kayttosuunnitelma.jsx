import React from 'react'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
import {formatPrice} from './Formatter'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'
import _ from 'lodash'

const findCost = (formContent, answers, budgetItem) => Number(InputValueStorage.readValue(formContent, answers, budgetItem.children[1].id))

export const Kayttosuunnitelma = ({formContent, avustushaku, hakemus, L}) => {
  FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
    .map(budgetItem => _.extend(budgetItem, {
      original: findCost(formContent, hakemus.answers, budgetItem),
      overridden: findCost(formContent, hakemus.arvio['overridden-answers'], budgetItem)
    }))

  const tables = FormUtil.findFieldsByFieldType(formContent, 'vaBudget')[0].children
    .filter(table => table.fieldType === 'vaSummingBudgetElement')
  const BudgetTable = (table, totalSum) =>
    <table key={table.id}>
      <thead>
      <tr>
        <th>{table.label[L.lang]}</th>
        <th className="amount budgetAmount"><L translationKey="haettu"/>
        </th>
        <th className="amount budgetAmount"><L translationKey="hyvaksytty"/>
        </th>
      </tr>
      </thead>
      <tbody>
      {table.children.map(budgetItem=><BudgetItemRow key={budgetItem.id} item={budgetItem} lang={L.lang}
                                                     useDetailedCosts={hakemus.arvio.useDetailedCosts}/>)}
      </tbody>
      <tfoot>
      <tr>
        <th><L translationKey="yhteensa"/></th>
        <th className="amount budgetAmount">{formatPrice(_.sum(table.children.map(i=>Number(i.original))))}</th>
        <th className="amount budgetAmount">{formatPrice(_.sum(table.children.map(i=>Number(i.overridden))))}</th>
      </tr>
      {totalSum && <tr>
        <th><L translationKey="rahoitus"/> <L translationKey="yhteensa"/></th>
        <th colSpan="2" className="amount budgetAmount">{formatPrice(totalSum)}</th>
      </tr>}
      </tfoot>
    </table>

  const calculatedTotalSum = _.sum(_.flatten(tables.map(t => t.children)).map(budgetItem => budgetItem.params.incrementsTotal ? +budgetItem.overridden : -budgetItem.overridden))
  return <div>
    <section className="section">
      <h1><L translationKey="kayttosuunnitelma"/></h1>

      <p><strong>{avustushaku.content.name[L.lang]}</strong></p>
      <p><L translationKey="hanke"/> {hakemus['project-name']}
      </p>
      <p><L translationKey="myonnetty-title"/></p>
      <p>{hakemus.arvio.perustelut}</p>

      {_.initial(tables).map(table => BudgetTable(table))}
      {BudgetTable(_.last(tables), calculatedTotalSum)}
    </section>
  </div>

}

const BudgetItemRow = ({item, lang, useDetailedCosts}) =>
  <tr>
    <td>{item.label[lang]}</td>
    <td className="amount budgetAmount">{formatPrice(item.original)}</td>
    <td className="amount budgetAmount">{useDetailedCosts && formatPrice(item.overridden)}</td>
  </tr>
