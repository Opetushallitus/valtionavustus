import React, {Component} from 'react'

export default class ApplicationPayments extends Component {
  constructor(props) {
    super(props)
    this.onAddPayment = this.onAddPayment.bind(this)
    this.onPaymentSumChange = this.onPaymentSumChange.bind(this)
    this.renderPayment = this.renderPayment.bind(this)
    this.resetPaymentSum = this.resetPaymentSum.bind(this)
    this.paidToDate = this.paidToDate.bind(this)
    this.resetPaymentSum(this.props.payments)
  }

  componentWillReceiveProps(nextProps) {
    const currentPaymentsLength = this.props.payments ? this.props.payments.length : 0
    const nextPaymentsLength = nextProps.payments ? nextProps.payments.length : 0
    if (currentPaymentsLength !== nextPaymentsLength) {
      this.resetPaymentSum(nextProps.payments)
    }
  }

  resetPaymentSum(payments) {
    const value = Math.floor(
      this.calculateDefaultValue(
        this.props.grant, this.props.application, payments))
    this.state = {
      newPaymentSum: isFinite(value) ? value : 0 }
  }

  calculateDefaultValue(grant, application, payments) {
    if ((!payments || payments.length === 0) &&
        (grant.content["payment-size-limit"] === "no-limit" ||
         application["budget-oph-share"] >=
         grant.content["payment-fixed-limit"])) {
      return application["budget-oph-share"] *
        grant.content["payment-min-first-batch"] / 100.0
    } else {
      return application["budget-oph-share"] - this.paidToDate(payments)
    }
  }

  paidToDate(payments) {
    return payments ? payments.reduce((p, n) => p + n["payment-sum"], 0) : 0
  }

  onAddPayment() {
    this.props.onAddPayment(this.state.newPaymentSum)
    this.setState({
      newPaymentSum: this.props.application["budget-oph-share"]
        - this.paidToDate(this.props.payments) - this.state.newPaymentSum})
  }

  onPaymentSumChange(e) {
    this.setState({newPaymentSum: Number(e.target.value)})
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
          {(100.0 * p["payment-sum"] / total).toFixed(0)} %
        </td>
      </tr>
    )
  }
  render() {
    const {application, grant} = this.props
    const payments = this.props.payments || []
    const renderPaymentPercentage =
          this.createPaymentPercentageRenderer(application["budget-oph-share"])
    const paidToDate = this.paidToDate(payments)
    const grantLeft = application["budget-oph-share"] - paidToDate
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
              {(grantLeft > 0) ? (
                <tr>
                  <td>{`${payments.length + 1}. erä`}</td>
                  <td className="payment-money-column">
                    <input value={this.state.newPaymentSum}
                           onChange={this.onPaymentSumChange}
                           type={this.props.inputType}
                           size={10}/> €
                  </td>
                </tr>) : null}
              <tr>
                <td>Yhteensä</td>
                <td className="payment-money-column">
                  {paidToDate + this.state.newPaymentSum} €
                </td>
              </tr>
            </tbody>
          </table>
          <table className="payment-info-column">
            <tbody>
              <tr>
                <td>Omarahoitus-%</td>
                <td className="payment-money-column">
                  {grant.content["self-financing-percentage"]} %
                </td>
              </tr>
              <tr>
                <td>OPH:n rahoitus-%</td>
                <td className="payment-money-column">
                  {100 - grant.content["self-financing-percentage"]} %
                </td>
              </tr>
              {payments.map(renderPaymentPercentage)}
              {(grantLeft > 0) ?
                renderPaymentPercentage({"payment-sum": this.state.newPaymentSum},
                  payments.length) : null
              }
              <tr>
                <td>Yhteensä</td>
                <td className="payment-money-column">
                  {
                    (100.0 * (paidToDate + this.state.newPaymentSum) /
                     application["budget-oph-share"]).toFixed(0)
                  } %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button onClick={this.onAddPayment}
                disabled={(grantLeft - this.state.newPaymentSum) < 0}>
          Lisää {payments.length + 1}. erä maksatuslistaan
        </button>
      </div>
    )
  }
}
