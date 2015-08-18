import React from 'react'
import Translator from '../Translator.js'

export default class HelpTooltip extends React.Component {
  render() {
    const translator = new Translator(this.props)
    console.log('this.props.content', this.props.content)
    const value = translator.translate("content", this.props.lang)
    return <a className="soresu-tooltip">
      <img src="img/show_tooltip.png"/>
      <span>{value}</span>
    </a>
  }
}
