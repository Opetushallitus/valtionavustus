import React from 'react'

import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import VaTraineeDayUtil from 'va-common/web/va/VaTraineeDayUtil'

export default class TraineeDayCalculatorSummary extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    const hakemus = this.props.customProps.originalHakemus
    const originalSum = VaTraineeDayUtil.sumSubfieldValues(
      InputValueStorage.readValues(hakemus.answers, "vaTraineeDayCalculator"),
      "total")
    const grantedSum = VaTraineeDayUtil.sumSubfieldValues(
      InputValueStorage.readValues(hakemus.arvio["overridden-answers"], "vaTraineeDayCalculator"),
      "total")
    const originalCostsPerTraineeDay = hakemus["budget-total"]/originalSum
    const grantedCostsPerTraineeDay = hakemus.arvio["budget-granted"]/grantedSum

    return (
      <div>
        <table id={htmlId}>
          <colgroup>
            <col style={{width:"60%"}}/>
            <col style={{width:"5%"}}/>
            <col style={{width:"5%"}}/>
            <col style={{width:"5%"}}/>
            <col style={{width:"5%"}}/>
            <col style={{width:"10%"}}/>
            <col style={{width:"10%"}}/>
          </colgroup>
          <thead>
            <tr>
              <td><strong>Koulutusosiot</strong></td>
              <td colSpan="2" className="text-gray text-center">Laajuus</td>
              <td colSpan="2" className="text-gray text-center">Osallist.</td>
              <td className="text-gray">Haett.</td>
              <td className="text-gray">Myönn.</td>
            </tr>
          </thead>
          <tbody>
          {children}
          </tbody>
          <tfoot>
          <tr>
            <td colSpan="5"><strong>Koulutettavapäivät yhteensä:</strong></td>
            <td className="text-gray">{VaTraineeDayUtil.formatFloat(originalSum)}</td>
            <td><strong>{VaTraineeDayUtil.formatFloat(grantedSum)}</strong></td>
          </tr>
          <tr>
            <td colSpan="5"><strong>Kustannukset per koulutettavapäivä:</strong></td>
            <td className="text-gray">{VaTraineeDayUtil.formatFloat(originalCostsPerTraineeDay)} €</td>
            <td><strong>{VaTraineeDayUtil.formatFloat(grantedCostsPerTraineeDay)} €</strong></td>
          </tr>
          </tfoot>
        </table>
      </div>
    )
  }
}
