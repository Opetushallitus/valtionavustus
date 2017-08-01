import React from 'react'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'

import EnvironmentInfo from 'va-common/web/va/EnvironmentInfo.jsx'

export default class VaLoginTopbar extends React.Component {
  render() {
    return (
      <section id="topbar">
        <div id="top-container">
          <img id="logo" src="img/logo-240x68@2x.png" width="240" height="68" alt="Opetushallitus / Utbildningsstyrelsen" />
          <div className="topbar-right">
            <h1 id="topic"><LocalizedString translations={this.props.translations.form} translationKey="heading" lang={this.props.lang}/></h1>
            <div>
              <div className="important-info">
                <EnvironmentInfo environment={this.props.environment}/>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}
