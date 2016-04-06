import React from 'react'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
import {formatNumber} from './Formatter'

export const Koulutusosiot = ({list, answers}) => {
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
    <p>Valtionavustusta / määrärahaa voidaan käyttää seuraaviin koulutusosioihin:</p>
    <table>
      <thead>
      <tr>
        <th rowSpan="2" >Koulutusosiot</th>
        <th colSpan="2" className="groupTitle">Laajuus</th>
        <th colSpan="2" className="groupTitle">Osallistujat</th>
        <th colSpan="2" className="groupTitle">Koulutettavatpäivät</th>
      </tr>
      <tr>
        <th className="amount">Haettu</th>
        <th className="amount">Myönnetty</th>
        <th className="amount">Haettu</th>
        <th className="amount">Myönnetty</th>
        <th className="amount">Haettu</th>
        <th className="amount">Myönnetty</th>
      </tr>
      </thead>
      <tbody>
      {rows
        .map((row, i) => <tr key={i}>
          <td>{row.name}</td>
          <td className="amount">{row.applied.scope} {row.applied.scopeType}</td>
          <td className="amount">{row.granted.scope} {row.granted.scopeType}</td>
          <td className="amount">{row.applied.personCount}</td>
          <td className="amount">{row.granted.personCount}</td>
          <td className="amount">{row.applied.totalFormatted}</td>
          <td className="amount">{row.granted.totalFormatted}</td>
        </tr>)}
      </tbody>
      <tfoot>
      <tr>
        <th colSpan="5">Koulutettavatpäivät yhteensä</th>
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

