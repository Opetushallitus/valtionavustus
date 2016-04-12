import React from 'react'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
import {formatPrice} from './Formatter'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'

const findCost = (formContent, answers, budgetItem) => Number(InputValueStorage.readValue(formContent, answers, budgetItem.children[1].id))

export const Kayttosuunnitelma = ({formContent, avustushaku, hakemus, totalCosts, totalOriginalCosts, totalGranted, L}) => {
  const budgetItems = FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
    .map(budgetItem => _.extend(budgetItem, {
      original: findCost(formContent, hakemus.answers, budgetItem),
      overridden: findCost(formContent, hakemus.arvio['overridden-answers'], budgetItem)
    }))

  const tables = FormUtil.findFieldsByFieldType(formContent, 'vaBudget')[0].children
    .filter(table => table.fieldType === 'vaSummingBudgetElement')
  console.log(tables)

  const rahoitusItems = FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
    .filter(budgetItem => !budgetItem.params.incrementsTotal)
    .map(budgetItem => _.extend(budgetItem, {
      original: findCost(formContent, hakemus.answers, budgetItem)
    }))
  const totalRahoitus = formatPrice(_.sum(rahoitusItems.map(i=>Number(i.original))))
  const BudgetTable = table =>
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
        <th className="amount budgetAmount">{totalOriginalCosts}</th>
        <th className="amount budgetAmount">{totalCosts}</th>
      </tr>
      </tfoot>
    </table>

  return <div>
    <section className="section">
      <h1><L translationKey="kayttosuunnitelma"/></h1>

      <p><strong>{avustushaku.content.name[L.lang]}</strong></p>
      <p><L translationKey="hanke"/> {hakemus['project-name']}
      </p>
      <p><L translationKey="myonnetty-title"/></p>
      <p>{hakemus.arvio.perustelut}</p>

      {tables[0] && BudgetTable(tables[0])}
      {tables[1] && BudgetTable(tables[1])}
      {tables[2] && BudgetTable(tables[2])}
    </section>
  </div>

}

const BudgetItemRow = ({item, lang, useDetailedCosts}) =>
  <tr>
    <td>{item.label[lang]}</td>
    <td className="amount budgetAmount">{formatPrice(item.original)}</td>
    <td className="amount budgetAmount">{useDetailedCosts && formatPrice(item.overridden)}</td>
  </tr>

const IncomeBudgetItemRow = ({item, lang}) =>
  <tr>
    <td>{item.label[lang]}</td>
    <td className="amount budgetAmount">{formatPrice(item.original)}</td>
  </tr>
