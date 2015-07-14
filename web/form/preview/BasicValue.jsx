import React from 'react'
import PreviewElement from './PreviewElement.jsx'

export default class BasicValue extends PreviewElement {
  render() {
    var value = "\u00a0" //&nbsp;
    if (this.props.value) {
      value = this.props.value
    }
    return super.render(<span className="soresu-value" id={this.props.htmlId}>{value}</span>)
  }
}