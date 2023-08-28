import React, { Component } from 'react'

export default class ApplicationPayments extends Component {
  constructor(props) {
    super(props)
    this.onAddPayment = this.onAddPayment.bind(this)
    this.onPaymentSumChange = this.onPaymentSumChange.bind(this)
    this.renderPayment = this.renderPayment.bind(this)
    this.state = ApplicationPayments.initialState(props)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.application.id !== state.currentApplicationId) {
      return ApplicationPayments.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props) {
    return {
      currentApplicationId: props.application.id,
      newPaymentSum: ApplicationPayments.calculateNextPaymentSum(props),
    }
  }

  static calculateNextPaymentSum(props) {
    const value = Math.floor(
      ApplicationPayments.calculateDefaultValue(props.grant, props.application, props.payments)
    )
    return isFinite(value) ? value : 0
  }

  static calculateDefaultValue(grant, application, payments) {
    if (
      (!payments || payments.length === 0) &&
      (grant.content['payment-size-limit'] === 'no-limit' ||
        application.arvio['budget-granted'] >= grant.content['payment-fixed-limit'])
    ) {
      return (
        (application.arvio['budget-granted'] * grant.content['payment-min-first-batch']) / 100.0
      )
    } else {
      return application.arvio['budget-granted'] - ApplicationPayments.paidToDate(payments)
    }
  }

  static paidToDate(payments) {
    return payments ? payments.reduce((p, n) => p + n['payment-sum'], 0) : 0
  }

  onAddPayment() {
    this.props.onAddPayment(this.state.newPaymentSum, this.props.index)
  }

  onPaymentSumChange(e) {
    this.setState({ newPaymentSum: Number(e.target.value) })
  }

  localeString(num) {
    if (typeof num !== 'number') {
      return num
    }
    return typeof Number.prototype.toLocaleString === 'function'
      ? num.toLocaleString()
      : num.toString()
  }

  renderPayment(p, i) {
    const onRemoveCurrentPayment = () => this.props.onRemovePayment(p.id)
    return (
      <tr key={i}>
        <td>{i + 1}. erä</td>
        <td className="payment-money-column">{this.localeString(p['payment-sum'])} €</td>
        <td>
          {p['paymentstatus-id'] === 'waiting' && (
            <button
              type="button"
              onClick={onRemoveCurrentPayment}
              className="remove delete-payment-button"
              alt="Poista maksuerä"
            />
          )}
        </td>
      </tr>
    )
  }

  createPaymentPercentageRenderer(total) {
    return (p, i) => (
      <tr key={i}>
        <td>{i + 1}. erä OPH:n avustussummasta</td>
        <td className="payment-money-column">
          {((100.0 * p['payment-sum']) / total).toFixed(0)} %
        </td>
      </tr>
    )
  }
  render() {
    const { application, grant, index, readonly } = this.props
    const payments = this.props.payments || []
    const renderPaymentPercentage = this.createPaymentPercentageRenderer(
      application.arvio['budget-granted']
    )
    const paidToDate = ApplicationPayments.paidToDate(payments)
    const grantLeft = application.arvio['budget-granted'] - paidToDate
    const addEnabled = !readonly && grantLeft > 0 && index === payments.length
    const newPaymentSum = addEnabled ? this.state.newPaymentSum : 0
    const costsGranted = application['arvio']['costsGranted'] || application['budget-total']

    return (
      <div className={!this.props.payments ? 'application-payments-disabled' : ''}>
        <h3>Maksuerät</h3>
        <div>Rahoitettavaa yhteensä {this.localeString(costsGranted)} €</div>
        <div className="payment-info-columns">
          <table className="payment-info-column">
            <tbody>
              <tr>
                <td>Omarahoitus</td>
                <td className="payment-money-column">
                  {this.localeString(costsGranted - application.arvio['budget-granted'])} €
                </td>
              </tr>
              <tr>
                <td>OPH:n avustus</td>
                <td className="payment-money-column">
                  {this.localeString(application.arvio['budget-granted'])} €
                </td>
              </tr>
              {payments.map(this.renderPayment)}
              {addEnabled ? (
                <tr>
                  <td>{`${payments.length + 1}. erä`}</td>
                  <td className="payment-money-column">
                    <input
                      value={this.state.newPaymentSum}
                      onChange={this.onPaymentSumChange}
                      type={this.props.inputType}
                      size={10}
                    />{' '}
                    €
                  </td>
                </tr>
              ) : null}
              <tr>
                <td>Yhteensä</td>
                <td className="payment-money-column">
                  {this.localeString(paidToDate + newPaymentSum)} €
                </td>
              </tr>
            </tbody>
          </table>
          <table className="payment-info-column">
            <tbody>
              <tr>
                <td>Omarahoitus-%</td>
                <td className="payment-money-column">
                  {grant.content['self-financing-percentage']} %
                </td>
              </tr>
              <tr>
                <td>OPH:n rahoitus-%</td>
                <td className="payment-money-column">
                  {100 - grant.content['self-financing-percentage']} %
                </td>
              </tr>
              {payments.map(renderPaymentPercentage)}
              {grantLeft > 0 && addEnabled
                ? renderPaymentPercentage(
                    { 'payment-sum': this.state.newPaymentSum },
                    payments.length
                  )
                : null}
              <tr>
                <td>Yhteensä</td>
                <td className="payment-money-column">
                  {application.arvio['budget-granted']
                    ? (
                        (100.0 * (paidToDate + newPaymentSum)) /
                        application.arvio['budget-granted']
                      ).toFixed(0)
                    : 0}{' '}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {addEnabled && (
          <button
            onClick={this.onAddPayment}
            disabled={
              grantLeft - this.state.newPaymentSum < 0 ||
              grantLeft === 0 ||
              this.state.newPaymentSum === 0 ||
              index !== payments.length
            }
          >
            Lisää {index + 1}. erä maksatuslistaan
          </button>
        )}
      </div>
    )
  }
}
