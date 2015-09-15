import React, { Component } from 'react'

export default class HakemusStatus extends Component {
  render() {
    const status = this.props.status
    var value = status
    switch(status) {
      case "unhandled":
        value = "Käsittelemättä"
        break
      case "plausible":
        value = "Mahdollinen"
        break
      case "rejected":
        value = "Hylätty"
        break
      case "accepted":
        value = "Hyväksytty"
        break;
    }
    return (
      <span className={status}>{value}</span>
    )
  }
}
