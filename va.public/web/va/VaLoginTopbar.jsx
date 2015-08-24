import React from 'react'

import LocalizedString from '../form/component/LocalizedString.jsx'

export default class VaLogin extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <section id="topbar">
      <div id="top-container">
        <img id="logo" src="img/logo.png"/>
        <h1 id="topic"><LocalizedString translations={this.props.translations.form} translationKey="heading" lang={this.props.lang}/></h1>
      </div>
    </section>
  }
}