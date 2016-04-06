import React from 'react'
import {formatPrice} from './Formatter'

export const Kayttosuunnitelma = ({budgetItems, rahoitusItems, avustushaku, hakemus, totalCosts, totalOriginalCosts, totalRahoitus, totalGranted, L}) =>
  <div>
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
