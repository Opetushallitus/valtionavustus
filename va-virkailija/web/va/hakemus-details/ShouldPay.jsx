import React from 'react'
import _ from "lodash"

export default class ShouldPay extends React.Component {
  constructor(props){
    super(props)
  }

  onHakemusShouldPayChange(event) {
   this.props.controller.setHakemusShouldPay(this.props.hakemus, event.target.value)()
  }
  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const arvio = hakemus.arvio
    const selectedShouldPay = arvio["should-pay"] !== false
    this.onHakemusShouldPayChange = this.onHakemusShouldPayChange.bind(this)

    const options = _.flatten([
      {htmlId: "set-should-pay-true", value: true, label: "Kyllä"},
      {htmlId: "set-should-pay-false", value: false, label: "Ei"}
    ].map(spec =>
      [
        <input id={spec.htmlId}
               key={spec.htmlId}
               type="radio"
               name="should-pay"
               value={spec.value}
               onChange={this.onHakemusShouldPayChange}
               checked={spec.value === selectedShouldPay}
               disabled={!allowEditing} />,
        <label key={spec.htmlId + "-label"}
               htmlFor={spec.htmlId}>{spec.label}</label>
      ]
    ))

    return (
      <div id="set-should-pay-grant">
        <h3>Maksuun:</h3>
        <fieldset className="soresu-radiobutton-group">
          {options}
        </fieldset>

      </div>
    )
  }

}
