import React from 'react'
import _ from 'lodash'

import Translator from '../Translator'

export default class ServerError extends React.Component {
  constructor(props) {
    super(props)
    this.translations = this.props.translations
  }

  render() {
    const lang = this.props.lang
    const translator = new Translator(this.translations)
    const serverError = this.props.serverError.length > 0 ? translator.translate(this.props.serverError, lang) : ""

    if (serverError.length === 0) {
      return null
    }

    return <span id="server-error">{serverError}</span>
  }
}
