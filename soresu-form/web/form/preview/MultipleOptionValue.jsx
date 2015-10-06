import React from 'react'
import _ from 'lodash'

import PreviewComponent from './PreviewComponent.jsx'
import LocalizedString from '../component/LocalizedString.jsx'

export default class MultipleOptionValue extends PreviewComponent {
  render() {
    const options = this.props.options
    const lang = this.props.lang
    const values = []
    if (options) {
      for (var i=0; i < options.length; i++) {
        const isFirst = values.length === 0
        const option = options[i]
        if (_.contains(this.props.value, option.value)) {
          values.push(
            <span key={i}>
              <span hidden={isFirst}>, </span>
              <LocalizedString translations={option} translationKey="label" lang={lang} />
            </span>
          )
        }
      }
    }
    return super.render(<span className="soresu-value" id={this.props.htmlId}>{values}</span>)
  }
}
