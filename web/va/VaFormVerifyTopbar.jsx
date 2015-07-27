import React from 'react'

import LocalizedString from '../form/component/LocalizedString.jsx'

export default class VaFormVerifyTopbar extends React.Component {
  render() {
    const state = this.props.state
    const configuration = state.configuration
    const lang = configuration.lang
    const translations = configuration.translations

    return(
      <section id="topbar">
        <div id="top-container">
          <img id="logo" src="img/logo.png"/>
          <h1 className="centered-text" id="topic"><LocalizedString translations={translations.verification} translationKey="heading" lang={lang}/></h1>
        </div>
      </section>
    )
  }
}