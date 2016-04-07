import React from 'react'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
import {formatNumber} from './Formatter'

export const Koulutusosiot = ({list, answers, L}) => {
  var rows = list
    .map(x => {
      var value = x.value
      var appliedObj = FormUtil.findFieldsByFieldType(value, 'vaTraineeDayCalculator')[0]
      var grantedRowObj = answers.find(answer => answer.key === appliedObj.key).value
      return {
        name: _.get(FormUtil.findFieldsByFieldType(value, 'nameField'), '[0].value', ''),
        applied: traineeCalcObj(appliedObj.value),
        granted: traineeCalcObj(grantedRowObj)
      }
    })
  return <section className="section">
    <p><L translationKey="koulutusosio-title"/></p>
    <table>
      <thead>
      <tr>
        <th rowSpan="2" ><L translationKey="koulutusosiot" /></th>
        <th colSpan="2" className="groupTitle"><L translationKey="koulutusosiot" /></th>
        <th colSpan="2" className="groupTitle"><L translationKey="osallistujat" /></th>
        <th colSpan="2" className="groupTitle"><L translationKey="koulutettavapaivat" /></th>
      </tr>
      <tr>
        <th className="amount"><L translationKey="haettu" /></th>
        <th className="amount"><L translationKey="hyvaksytty" /></th>
        <th className="amount"><L translationKey="haettu" /></th>
        <th className="amount"><L translationKey="hyvaksytty" /></th>
        <th className="amount"><L translationKey="haettu" /></th>
        <th className="amount"><L translationKey="hyvaksytty" /></th>
      </tr>
      </thead>
      <tbody>
      {rows
        .map((row, i) => <tr key={i}>
          <td>{row.name}</td>
          <td className="amount">{row.applied.scope} <L translationKey={row.applied.scopeType} /></td>
          <td className="amount">{row.granted.scope} <L translationKey={row.granted.scopeType} /></td>
          <td className="amount">{row.applied.personCount}</td>
          <td className="amount">{row.granted.personCount}</td>
          <td className="amount">{row.applied.totalFormatted}</td>
          <td className="amount">{row.granted.totalFormatted}</td>
        </tr>)}
      </tbody>
      <tfoot>
      <tr>
        <th colSpan="5"><L translationKey="koulutettavapaivat-yhteensa" /></th>
        <th className="amount">{sumTraineeCalculations(rows.map(x=>x.applied.total))}</th>
        <th className="amount">{sumTraineeCalculations(rows.map(x=>x.granted.total))}</th>
      </tr>
      </tfoot>
    </table>
  </section>
}

const traineeCalcObj = obj => ({
  scope: findByKeyEnd(obj, '.scope'),
  personCount: findByKeyEnd(obj, '.person-count'),
  scopeType: findByKeyEnd(obj, '.scope-type'),
  total:  findByKeyEnd(obj, '.total'),
  totalFormatted:  formatNumber(findByKeyEnd(obj, '.total').replace(',0', ''))
})

const sumTraineeCalculations = list => formatNumber(_.sum(list.map(x=>Number(x.replace(',', '.')))))


const findByKeyEnd = (list, keyEnd) => _.get(list.find(x => x.key.endsWith(keyEnd)), 'value', '')

