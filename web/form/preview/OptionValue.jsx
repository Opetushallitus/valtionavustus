import React from 'react'
import PreviewComponent from './PreviewComponent.jsx'
import LocalizedString from '../component/LocalizedString.jsx'

export default class OptionValue extends PreviewComponent {
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