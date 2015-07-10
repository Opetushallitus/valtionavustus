import React from 'react'

export default class BasicValue extends React.Component {
  render() {
    var value = "\u00a0" //&nbsp;
    if (this.props.value) {
      value = this.props.value
    }
    return (<span className="soresu-value" id={this.props.htmlId}>{value}</span>)
  }
}