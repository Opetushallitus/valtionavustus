import React from 'react'
import { getTalousarvio } from 'soresu-form/web/va/Muutoshakemus'

import { Hakemus } from 'soresu-form/web/va/types'
import { Muutoshakemus, Talousarvio } from 'soresu-form/web/va/types/muutoshakemus'

type BudgetTableProps = {
  muutoshakemukset: Muutoshakemus[]
  hakemus: Hakemus
  hakuData: any
}

type AvustushakuMeno = {
  type: string
  'translation-fi': string
  'translation-sv': string
}

const renderBudgetRow = (
  avustushakuMeno: AvustushakuMeno,
  hakemus?: Hakemus,
  talousarvio?: Talousarvio
) => {
  const meno = talousarvio?.find((t) => t.type === avustushakuMeno.type)
  const grantedMeno = hakemus?.arvio['overridden-answers']?.value.find(
    (a) => a.key === `${avustushakuMeno.type}.amount`
  )?.value
  const grantedDescription = hakemus?.arvio['overridden-answers']?.value.find(
    (a) => a.key === `${avustushakuMeno.type}.description`
  )?.value
  const valiselvitysMeno = hakemus?.selvitys?.valiselvitys.answers?.find(
    (a) => a.key === `${avustushakuMeno.type}.amount`
  )?.value
  const valiselvitysDescription = hakemus?.selvitys?.valiselvitys.answers?.find(
    (a) => a.key === `${avustushakuMeno.type}.description`
  )?.value
  const loppuselvitysMeno = hakemus?.selvitys?.loppuselvitys.answers?.find(
    (a) => a.key === `${avustushakuMeno.type}.amount`
  )?.value
  const loppuselvitysDescription = hakemus?.selvitys?.valiselvitys.answers?.find(
    (a) => a.key === `${avustushakuMeno.type}.description`
  )?.value
  return (
    <tr
      key={avustushakuMeno.type}
      id="budget-edit-personnel-costs-row"
      className="budget-item"
      data-test-id={avustushakuMeno.type}
    >
      <td className="label-column">
        <span>{avustushakuMeno['translation-fi']}</span>
      </td>
      <td className="granted-amount-column" title={grantedDescription ?? ''}>
        {grantedMeno !== undefined ? <span className="money">{grantedMeno}</span> : ''}
      </td>
      {valiselvitysMeno !== undefined && (
        <td className="valiselvitys-amount-column has-title" title={valiselvitysDescription}>
          <span className="money">{valiselvitysMeno}</span>
        </td>
      )}
      {loppuselvitysMeno !== undefined && (
        <td className="loppuselvitys-amount-column has-title" title={loppuselvitysDescription}>
          <span className="money">{loppuselvitysMeno}</span>
        </td>
      )}
      <td className="amount-column">
        <span className="money">{meno?.amount}</span>
      </td>
      <td className="description-column"></td>
    </tr>
  )
}

export const BudgetTable = (props: BudgetTableProps) => {
  const { hakuData, hakemus, muutoshakemukset } = props
  const talousarvio = muutoshakemukset
    ? getTalousarvio(muutoshakemukset, hakemus.normalizedData?.talousarvio)
    : hakemus.normalizedData?.talousarvio
  const grantedSum = (hakemus.normalizedData?.talousarvio ?? []).reduce(
    (acc, cur) => acc + cur.amount,
    0
  )
  const amount = talousarvio?.length
    ? talousarvio?.reduce((acc, cur) => acc + cur.amount, 0)
    : hakemus.arvio.costsGranted
  const isValiselvitys = hakemus.selvitys?.valiselvitys.answers?.length
  const isLoppuselvitys = hakemus.selvitys?.loppuselvitys.answers?.length
  return (
    <section id="budget-edit-container">
      <form className="soresu-form">
        <fieldset id="budget-edit-budget" className="va-budget">
          <table id="budget-edit-project-budget" className="summing-table">
            <caption>
              <span>Talousarvio</span>
            </caption>
            <colgroup>
              <col className="label-column" />
              <col className="granted-amount-column" />
              {isValiselvitys && <col className="valiselvitys-amount-column" />}
              {isLoppuselvitys && <col className="loppuselvitys-amount-column" />}
              <col className="amount-column" />
              <col className="description-column" />
            </colgroup>
            <thead>
              <tr>
                <th className="label-column">
                  <span>Menot</span>
                </th>
                <th className="granted-amount-column">Myön­netty</th>
                {isValiselvitys && (
                  <th className="valiselvitys-amount-column money">Väli­selvitys</th>
                )}
                {isLoppuselvitys && (
                  <th className="loppuselvitys-amount-column money">Loppu­selvitys</th>
                )}
                <th className="amount-column money required" style={{ textAlign: 'center' }}>
                  OPH:n hyväksymä
                </th>
                <th className="description-column"></th>
              </tr>
            </thead>
            <tbody>
              {!!hakemus.normalizedData?.talousarvio?.length &&
                hakuData.talousarvio?.map((m: AvustushakuMeno) =>
                  renderBudgetRow(m, hakemus, talousarvio)
                )}
            </tbody>
            <tfoot>
              <tr>
                <td className="label-column">
                  <span>Menot yhteensä</span>
                </td>
                <td className="granted-amount-column" data-test-id="granted-total">
                  <span className="money">{hakemus.arvio.costsGranted || grantedSum}</span>
                </td>
                {isValiselvitys && (
                  <td className="valiselvitys-amount-column">
                    <span className="money">
                      {hakemus.selvitys?.valiselvitys['budget-oph-share']}
                    </span>
                  </td>
                )}
                {isLoppuselvitys && (
                  <td className="loppuselvitys-amount-column">
                    <span className="money">
                      {hakemus.selvitys?.loppuselvitys['budget-oph-share']}
                    </span>
                  </td>
                )}
                <td className="amount-column" data-test-id="amount-total">
                  <span className="money sum">{amount}</span>
                </td>
                <td className="description-column"></td>
              </tr>
            </tfoot>
          </table>
        </fieldset>
      </form>
    </section>
  )
}
