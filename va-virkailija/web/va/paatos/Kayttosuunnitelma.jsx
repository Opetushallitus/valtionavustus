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
  const totalGranted = formatPrice(hakemus.arvio['budget-granted'])

  const calculatedTotalSum = _.sum(_.flatten(tables.map(t => t.children)).map(budgetItem => budgetItem.params.incrementsTotal ? +budgetItem.overridden : -budgetItem.overridden))
  const menot = tables[0] &&
    <table key={tables[0].id}>
      <thead>
      <tr>
        <th>{tables[0].label[L.lang]}</th>
        <th className="amount budgetAmount"><L translationKey="haettu"/>
        </th>
        <th className="amount budgetAmount"><L translationKey="hyvaksytty"/>
        </th>
      </tr>
      </thead>
      <tbody>
      {tables[0].children.map(budgetItem=><BudgetItemRow key={budgetItem.id} item={budgetItem} lang={L.lang}
                                                     useDetailedCosts={useDetailedCosts}/>)}
      </tbody>
      <tfoot>
      <tr>
        <th>Hankkeen kokonaismenot yhteensä</th>
        <th className="amount budgetAmount">{formatPrice(_.sum(tables[0].children.map(i=>Number(i.original))))}</th>
        <th className="amount budgetAmount">{formatPrice(hakemus.arvio.useDetailedCosts ? _.sum(tables[0].children.map(i=>Number(i.overridden))) : hakemus.arvio.costsGranted)}</th>
      </tr>
      </tfoot>
    </table>

  const nettomenot = tables[1] &&

    <table key={tables[1].id}>
      <thead>
      <tr>
        <th>{tables[1].label[L.lang]}</th>
        <th className="amount budgetAmount"><L translationKey="haettu"/>
        </th>
        <th className="amount budgetAmount"><L translationKey="hyvaksytty"/>
        </th>
      </tr>
      </thead>
      <tbody>
      {tables[1].children.map(budgetItem=><BudgetItemRow key={budgetItem.id} item={budgetItem} lang={L.lang}
                                                         useDetailedCosts={true}/>)}
      </tbody>
      <tfoot>
      <tr>
        <th>Hankkeen nettomenot yhteensä</th>
        <th className="amount budgetAmount">{formatPrice(_.sum(tables[1].children.map(i=>Number(i.original))))}</th>
        <th className="amount budgetAmount">{formatPrice(123456)}</th>
      </tr>
      </tfoot>
    </table>
  const rahoitus = tables[2] &&
    <table key={tables[2].id}>
      <thead>
      <tr>
        <th>{tables[2].label[L.lang]}</th>
        <th className="amount budgetAmount"><L translationKey="haettu"/>
        </th>
        <th className="amount budgetAmount"><L translationKey="hyvaksytty"/>
        </th>
      </tr>
      </thead>
      <tbody>
      {tables[2].children.map(budgetItem=><BudgetItemRow key={budgetItem.id} item={budgetItem} lang={L.lang}
                                                         useDetailedCosts={true}/>)}
      </tbody>
      <tfoot>
      <tr>
        <th>Hankkeen rahoitus yhteensä</th>
        <th className="amount budgetAmount">{formatPrice(_.sum(tables[2].children.map(i=>Number(i.original))))}</th>
        <th className="amount budgetAmount">{formatPrice(_.sum(tables[2].children.map(i=>Number(i.overridden))))}</th>
      </tr>
      </tfoot>
    </table>

  return <div>
    <section className="section">
      <h1><L translationKey="kayttosuunnitelma"/></h1>
      {menot}
      {nettomenot}
      {rahoitus}
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
