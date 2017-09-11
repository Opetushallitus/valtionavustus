import React from 'react'
import Translator from '../Translator'

export default class LocalizedLink extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    const translator = new Translator(this.props.translations)
    const linkText = translator.translate(this.props.translationKey, this.props.lang, this.props.defaultValue, this.props.keyValues)
    const link = translator.translate(this.props.linkKey, this.props.lang, this.props.defaultLink, this.props.links)
    return (<a className={this.props.className}
               onClick={this.props.onClick}
               href={link}
               target={this.props.target}>{linkText}</a>)
  }
}
