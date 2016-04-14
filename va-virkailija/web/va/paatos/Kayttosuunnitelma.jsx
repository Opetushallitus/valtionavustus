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

  const useDetailedCosts = hakemus.arvio.useDetailedCosts

  const BudgetTable = (summaryTitle, table, useDetailedCosts, totalGranted) => {
    return <table key={table.id}>
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
                                                     useDetailedCosts={useDetailedCosts}/>)}
      </tbody>
      <tfoot>
      <tr>
        <th>{summaryTitle}</th>
        <th className="amount budgetAmount">{formatPrice(_.sum(table.children.map(i=>Number(i.original))))}</th>
        <th className="amount budgetAmount">{totalGranted}</th>
      </tr>
      </tfoot>
    </table>
  }

  const totalGranted = formatPrice(hakemus.arvio['budget-granted'])

  const calculatedTotalSum = _.sum(_.flatten(tables.map(t => t.children)).map(budgetItem => budgetItem.params.incrementsTotal ? +budgetItem.overridden : -budgetItem.overridden))
  return <div>
    <section className="section">
      <h1><L translationKey="kayttosuunnitelma"/></h1>

      {tables[0] && BudgetTable('Hankkeen kokonaismenot yhteensä', tables[0], useDetailedCosts, formatPrice(hakemus.arvio.useDetailedCosts ? _.sum(tables[0].children.map(i=>Number(i.overridden))) : hakemus.arvio.costsGranted))}
      {tables[1] && BudgetTable('Hankkeen nettomenot yhteensä', tables[1], true, formatPrice(123456))}
      {tables[2] && BudgetTable('Hankkeen rahoitus yhteensä', tables[2], true, formatPrice(_.sum(tables[2].children.map(i=>Number(i.original)))))}
      <table>
        <tbody>
        <tr>
          <th><L translationKey="myonnetty-avustus"/></th>
          <th colSpan="2" className="amount budgetAmount">{formatPrice(totalGranted)}</th>
        </tr>
        </tbody>
      </table>
    </section>
  </div>

}

const BudgetItemRow = ({item, lang, useDetailedCosts}) =>
  <tr>
    <td>{item.label[lang]}</td>
    <td className="amount budgetAmount">{formatPrice(item.original)}</td>
    <td className="amount budgetAmount">{useDetailedCosts && formatPrice(item.overridden)}</td>
  </tr>
