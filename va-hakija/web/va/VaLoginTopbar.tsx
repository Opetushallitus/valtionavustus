import React from 'react'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString'
import EnvironmentInfo from 'soresu-form/web/va/EnvironmentInfo'
import { LegacyTranslations } from 'soresu-form/web/va/types'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

type VaLoginTopBarProps = {
  lang: 'fi' | 'sv'
  translations: LegacyTranslations
  environment: EnvironmentApiResponse
}

export default class VaLoginTopbar extends React.Component<VaLoginTopBarProps> {
  render() {
    const lang = this.props.lang
    return (
      <section id="topbar">
        <div id="top-container">
          <img
            id="logo"
            src="img/logo-240x68@2x.png"
            width="240"
            height="68"
            alt="Opetushallitus / Utbildningsstyrelsen"
          />
          <div className="topbar-right">
            <h1 id="topic">
              <LocalizedString
                translations={this.props.translations.form}
                translationKey="heading"
                lang={lang}
              />
            </h1>
            <div>
              <div className="important-info">
                <EnvironmentInfo environment={this.props.environment} lang={lang} />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}
