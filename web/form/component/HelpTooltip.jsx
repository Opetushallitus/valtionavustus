import React from 'react'
import Translator from '../Translator.js'

export default class HelpTooltip extends React.Component {
  render() {
    const translator = new Translator(this.props)
    const value = translator.translate("content", this.props.lang)
    return <a className="soresu-tooltip soresu-tooltip-up">
      <img src="img/show_tooltip.png"/>
      <span>{value}</span>
    </a>
  }
}
