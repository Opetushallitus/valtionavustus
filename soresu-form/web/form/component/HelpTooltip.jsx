import React from 'react'
import Translator from '../Translator.js'

export default class HelpTooltip extends React.Component {
  render() {
    const translator = new Translator(this.props)
    const helpText = _.get(this.props, "content." + this.props.lang);
    if (!helpText || "" === helpText) {
      return <span/>
    }
    const value = translator.translate("content", this.props.lang)
    return <a className="soresu-tooltip soresu-tooltip-up soresu-help-icon">
      <span>{value}</span>
    </a>
  }
}
