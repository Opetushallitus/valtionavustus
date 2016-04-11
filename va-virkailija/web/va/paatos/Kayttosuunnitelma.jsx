import React from 'react'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
import {formatPrice} from './Formatter'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'

const findCost = (formContent, answers, budgetItem) => Number(InputValueStorage.readValue(formContent, answers, budgetItem.children[1].id))

export const Kayttosuunnitelma = ({formContent, avustushaku, hakemus, totalCosts, totalOriginalCosts, totalGranted, L}) => {
  const budgetItems = FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
    .filter(budgetItem => budgetItem.params.incrementsTotal)
    .map(budgetItem => _.extend(budgetItem, {
      original: findCost(formContent, hakemus.answers, budgetItem),
      overridden: findCost(formContent, hakemus.arvio['overridden-answers'], budgetItem)
    }))
  const rahoitusItems = FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
    .filter(budgetItem => !budgetItem.params.incrementsTotal)
    .map(budgetItem => _.extend(budgetItem, {
      original: findCost(formContent, hakemus.answers, budgetItem)
    }))
  const totalRahoitus = formatPrice(_.sum(rahoitusItems.map(i=>Number(i.original))))

  return <div>
    <section className="section">
      <h1><L translationKey="kayttosuunnitelma" /></h1>

      <p><strong>{avustushaku.content.name[L.lang]}</strong></p>
      <p><L translationKey="hanke" /> {hakemus['project-name']}
      </p>
      <p><L translationKey="myonnetty-title" /></p>
      <p>{hakemus.arvio.perustelut}</p>

      <table>
        <thead>
        <tr>
          <th><L translationKey="menot" /></th>
          <th className="amount budgetAmount"><L translationKey="haettu" />
          </th>
          <th className="amount budgetAmount"><L translationKey="hyvaksytty" />
          </th>
        </tr>
        </thead>
        <tbody>
        {budgetItems.map(budgetItem=><BudgetItemRow key={budgetItem.id} item={budgetItem} lang={L.lang} useDetailedCosts={hakemus.arvio.useDetailedCosts}/>)}
        </tbody>
        <tfoot>
        <tr>
          <th><L translationKey="yhteensa" /></th>
          <th className="amount budgetAmount">{totalOriginalCosts}</th>
          <th className="amount budgetAmount">{totalCosts}</th>
        </tr>
        <tr>
          <th colSpan="2"><L translationKey="myonnetty-avustus" />
          </th>
          <th className="amount budgetAmount">{totalGranted}</th>
        </tr>
        </tfoot>
      </table>

      <table>
        <thead>
        <tr>
          <th><L translationKey="rahoitus" /></th>
          <th className="amount budgetAmount"><L translationKey="summa" />
          </th>
        </tr>
        </thead>
        <tbody>
        {rahoitusItems.map(budgetItem=><IncomeBudgetItemRow key={budgetItem.id} item={budgetItem} lang={L.lang}/>)}
        </tbody>
        <tfoot>
        <tr>
          <th><L translationKey="yhteensa" /></th>
          <th className="amount budgetAmount">{totalRahoitus}</th>
        </tr>
        </tfoot>
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

const IncomeBudgetItemRow = ({item, lang}) =>
  <tr>
    <td>{item.label[lang]}</td>
    <td className="amount budgetAmount">{formatPrice(item.original)}</td>
  </tr>
