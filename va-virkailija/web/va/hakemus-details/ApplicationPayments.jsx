import React, {Component} from 'react'

export default class ApplicationPayments extends Component {
  constructor(props) {
    super(props)
    this.onAddPayment = this.onAddPayment.bind(this)
    this.onValueChange = this.onValueChange.bind(this)
    this.renderPayment = this.renderPayment.bind(this)
    this.state = {value: ""}
  }

  onAddPayment() {
    this.props.onAddPayment(Number(this.state.value))
    this.setState({value: ""})
  }

  onValueChange(e) {
    this.setState({value: e.target.value})
  }

  localeString(num) {
    if (typeof num !== "number") {
      return num
    }
    return (typeof Number.prototype.toLocaleString === "function") ?
      num.toLocaleString() : num.toString()
  }

  renderPayment(p, i) {
    return (
      <tr key={i}>
        <td>{i + 1}. erä</td>
        <td className="payment-money-column">
          {this.localeString(p["payment-sum"])} €
        </td>
      </tr>)
  }

  createPaymentPercentageRenderer(total) {
    return (p, i) => (
      <tr key={i}>
        <td>{i + 1}. erä OPH:n avustussummasta</td>
        <td className="payment-money-column">
          {(100.0 * p["payment-sum"] / total).toFixed(0)}%
        </td>
      </tr>
    )
  }

  render() {
    const {application, grant} = this.props
    const payments = application.payments || []
    const renderPaymentPercentage =
          this.createPaymentPercentageRenderer(application["budget-oph-share"])
    return (
      <div>
        <h3>Maksuerät</h3>
        <div>
          Rahoitettavaa yhteensä {this.localeString(application["budget-total"])} €
        </div>
        <div className="payment-info-columns">
          <table className="payment-info-column">
            <tbody>
              <tr>
                <td>Omarahoitus</td>
                <td className="payment-money-column">
                  {this.localeString(
                    application["budget-total"] -
                    application["budget-oph-share"])} €
                </td>
              </tr>
              <tr>
                <td>OPH:n avustus</td>
                <td className="payment-money-column">
                  {this.localeString(application["budget-oph-share"])} €
                </td>
              </tr>
              {payments.map(this.renderPayment)}
              <tr>
                <td>{`${payments.length + 1}. erä`}</td>
                <td className="payment-money-column">
                  <input value={this.state.value}
                         onChange={this.onValueChange}
                         type={this.props.inputType}
                         size={10}/> €
                </td>
              </tr>
            </tbody>
          </table>
          <table className="payment-info-column">
            <tbody>
              <tr>
                <td>Omarahoitus-%</td>
                <td className="payment-money-column">
                  {grant.content["self-financing-percentage"]}%
                </td>
              </tr>
              <tr>
                <td>OPH:n rahoitus-%</td>
                <td className="payment-money-column">
                  {100 - grant.content["self-financing-percentage"]}%
                </td>
              </tr>
              {payments.map(renderPaymentPercentage)}
              {
                renderPaymentPercentage({"payment-sum": this.state.value},
                  payments.length)
              }
            </tbody>
          </table>
        </div>
        <button onClick={this.onAddPayment}>
          Lisää {payments.length + 1}. erä maksatuslistaan
        </button>
      </div>
    )
  }
}
