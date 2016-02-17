import React from 'react'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import VaTraineeDayCalculator from 'va-common/web/va/VaTraineeDayCalculator.jsx'

export default class TraineeDayCalculatorSummary extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    const hakemus = this.props.customProps.originalHakemus

    const countSum = (answers) => {
      const traineeAnswers = InputValueStorage.readValues(answers, "vaTraineeDayCalculator")
      const scopeTotal = _.reduce(traineeAnswers, (acc, answer) => {
        const subTotal = VaTraineeDayCalculator.readTotalAsFloat(answer.key, answer)
        return (subTotal ? subTotal: 0) + acc }, 0
      )
      return scopeTotal
    }
    const grantedSum = countSum(hakemus.arvio["overridden-answers"])
    const originalSum = countSum(hakemus.answers)
    const budgetTotal = hakemus["budget-total"]
    const budgetGranted = hakemus.arvio["budget-granted"]
    const costPerTraineeDay = budgetTotal/originalSum
    const costPerTraineeDayGranted = budgetGranted/grantedSum

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
              <td colSpan="2" className="text-grey text-center">Laajuus</td>
              <td colSpan="2" className="text-grey text-center">Osallist.</td>
              <td className="text-grey">Haett.</td>
              <td className="text-grey">Myönn.</td>
            </tr>
          </thead>
          <tbody>
          {children}
          </tbody>
          <tfoot>
          <tr>
            <td colSpan="5"><strong>Koulutettavapäivät yhteensä:</strong></td>
            <td className="text-grey">{VaTraineeDayCalculator.formatFloat(originalSum)}</td>
            <td><strong>{VaTraineeDayCalculator.formatFloat(grantedSum)}</strong></td>
          </tr>
          <tr>
            <td colSpan="5"><strong>Kustannukset per koulutettavapäivä:</strong></td>
            <td className="text-grey">{VaTraineeDayCalculator.formatFloat(costPerTraineeDay)} €</td>
            <td><strong>{VaTraineeDayCalculator.formatFloat(costPerTraineeDayGranted)} €</strong></td>
          </tr>
          </tfoot>
        </table>
      </div>
    )
  }
}