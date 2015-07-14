import React from 'react'
import PreviewElement from './PreviewElement.jsx'
import LocalizedString from '../element/LocalizedString.jsx'

export default class OptionValue extends PreviewElement {
  render() {
    const field = this.props.field
    const lang = this.props.lang
    var value = "\u00a0" //&nbsp;
    if (field.options) {
      for (var i=0; i < field.options.length; i++) {
        if (field.options[i].value === this.props.value) {
          const val = field.options[i]
          value = <LocalizedString translations={val} translationKey="label" lang={lang} />
        }
      }
    }
    return super.render(<span className="soresu-value" id={this.props.htmlId}>{value}</span>)
  }
}