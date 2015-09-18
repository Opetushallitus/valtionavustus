import React, { Component } from 'react'

export default class HakuStatus extends Component {
  render() {
    const status = this.props.status
    var value = status
    switch(status) {
      case "new":
        value = "Uusi"
        break
      case "draft":
        value = "Luonnos"
        break
      case "published":
        value = "Julkaistu"
        break
    }
    return (
      <span className={status}>{value}</span>
    )
  }
}
