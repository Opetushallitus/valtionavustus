import React from 'react'
import Translator from './../Translator.js'

export default class LocalizedString extends React.Component {
  render() {
    const props = this.props
    const translator = new Translator(props.translations)
    const value = translator.translate(props.translationKey, props.lang, props.defaultValue, props.keyValues)
    return (
      <span id={props.htmlId}
            hidden={props.hidden}
            className={props.className}
            onClick={props.onClick}>{value}</span>
    )
  }
}
