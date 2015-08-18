import React from 'react'
import _ from 'lodash'

import Translator from './../Translator.js'

export default class ServerError extends React.Component {

  constructor(props) {
    super(props)
    this.translations = this.props.translations
  }

  render() {
    const lang = this.props.lang
    const translator = new Translator(this.translations)
    const serverError = this.props.serverError.length > 0 ? translator.translate(this.props.serverError, lang) : ""
    return (
      <span hidden={serverError.length === 0} className="server-error">{serverError}</span>
    )
  }
}
