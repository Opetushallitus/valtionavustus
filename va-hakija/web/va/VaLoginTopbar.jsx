import React from 'react'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'

import EnvironmentInfo from 'va-common/web/va/EnvironmentInfo.jsx'

export default class VaLogin extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <section id="topbar">
      <div id="top-container">
        <img id="logo" src="img/logo.png"/>
        <h1 id="topic"><LocalizedString translations={this.props.translations.form} translationKey="heading" lang={this.props.lang}/></h1>
        <div id="server-info"><EnvironmentInfo environment={this.props.environment}/></div>
      </div>
    </section>
  }
}
