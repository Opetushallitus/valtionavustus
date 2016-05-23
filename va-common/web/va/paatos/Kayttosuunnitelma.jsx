import React from 'react'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
import {formatPrice} from './Formatter'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'
import _ from 'lodash'

const findCost = (formContent, answers, budgetItem) => Number(InputValueStorage.readValue(formContent, answers, budgetItem.children[1].id))

export const Kayttosuunnitelma = (formContent, avustushaku, hakemus, L) => {
  const ophFinancingPercentage = (100-avustushaku.content["self-financing-percentage"])
  FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
    .map(budgetItem => _.extend(budgetItem, {
      original: findCost(formContent, hakemus.answers, budgetItem),
      overridden: findCost(formContent, hakemus.arvio['overridden-answers'], budgetItem)
    }))

  const tables = FormUtil.findFieldsByFieldType(formContent, 'vaBudget')[0].children
    .filter(table => table.fieldType === 'vaSummingBudgetElement')
  const useDetailedCosts = hakemus.arvio.useDetailedCosts
  const totalGranted = hakemus.arvio['budget-granted']
  const totallOriginalCosts = _.sum(tables[0].children.map(i=>Number(i.original)))
  const totalOverriddenCosts = hakemus.arvio.useDetailedCosts ? _.sum(tables[0].children.map(i=>Number(i.overridden))) : hakemus.arvio.costsGranted
  const TBody = ({table, useDetailedCosts}) => <tbody>{table.children
    .map(item =>
      <tr key={item.id}>
        <td>{item.label[L.lang]}</td>
        <td className="amount budgetAmount">{formatPrice(item.original)}</td>
        <td className="amount budgetAmount">{useDetailedCosts && formatPrice(item.overridden)}</td>
      </tr>
    )}</tbody>

  const totalIncomes = tables[1] ? _.sum(tables[1].children.map(i=>Number(i.original))) : 0
  const totalFinancing = tables[2] ? _.sum(tables[2].children.map(i=>Number(i.original))) : 0
  return {
    markup: <div>
    <section className="section">
      <h1><L translationKey="kayttosuunnitelma"/></h1>
      {tables[0] &&
      <table key={tables[0].id}>
        <thead>
        <tr>
          <th><L translationKey="hankkeen-menot"/></th>
          <th className="amount budgetAmount"><L translationKey="haettu"/></th>
          <th className="amount budgetAmount"><L translationKey="hyvaksytty"/></th>
        </tr>
        </thead>
        <TBody table={tables[0]} useDetailedCosts={useDetailedCosts}/>
        <tfoot>
        <tr>
          <th><L translationKey="kokonaismenot-yhteensa"/></th>
          <AmountCell>{totallOriginalCosts}</AmountCell>
          <AmountCell>{totalOverriddenCosts}</AmountCell>
        </tr>
        </tfoot>
      </table>
      }
      {tables[1] &&
      <table key={tables[1].id}>
        <thead>
        <tr>
          <th colSpan="3">{tables[1].label[L.lang]}</th>
        </tr>
        </thead>
        <TBody table={tables[1]} useDetailedCosts={true}/>
        <tfoot>
        <tr>
          <th><L translationKey="nettomenot-yhteensa"/></th>
          <AmountCell>{totallOriginalCosts - totalIncomes}</AmountCell>
          <AmountCell>{totalOverriddenCosts - totalIncomes}</AmountCell>
        </tr>
        </tfoot>
      </table>
      }
      {tables[2] &&
      <table key={tables[2].id}>
        <thead>
        <tr>
          <th colSpan="3">{tables[2].label[L.lang]}</th>
        </tr>
        </thead>
        <TBody table={tables[2]} useDetailedCosts={true}/>
        <tfoot>
        <tr>
          <th><L translationKey="rahoitus-yhteensa"/></th>
          <AmountCell>{totalFinancing}</AmountCell>
          <AmountCell>{totalFinancing}</AmountCell>
        </tr>
        </tfoot>
      </table>
      }
      <table>
        <tbody>
        <tr>
          <th className="footerTitle"><L translationKey="myonnetty-avustus"/> {ophFinancingPercentage!==100 ? ophFinancingPercentage + '%' :''}</th>
          <AmountCell>{Math.floor(((totallOriginalCosts - totalIncomes - totalFinancing)*ophFinancingPercentage)/100)}</AmountCell>
          <AmountCell>{totalGranted}</AmountCell>
        </tr>
        {ophFinancingPercentage!==100 && <tr>
          <th className="footerTitle"><L translationKey="oma-rahoitus"/> {ophFinancingPercentage!==100 ? (100-ophFinancingPercentage) + '%' :''}</th>
          <AmountCell>{Math.ceil(((totallOriginalCosts - totalIncomes - totalFinancing)*(100-ophFinancingPercentage))/100)}</AmountCell>
          <AmountCell>{Math.ceil(((totalOverriddenCosts - totalIncomes - totalFinancing)*(100-ophFinancingPercentage))/100)}</AmountCell>
        </tr>}
        </tbody>
      </table>
    </section>
  </div>,
    data: {
      nettomenotYhteensa: formatPrice(totalOverriddenCosts - totalIncomes)
    }
  }
}

const AmountCell = ({children}) => <th className="amount budgetAmount">{children && formatPrice(children)}</th>



