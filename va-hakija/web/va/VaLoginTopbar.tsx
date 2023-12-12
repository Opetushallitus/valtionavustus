import React from 'react'
import LocalizedString from 'soresu-form/web/form/component/LocalizedString'
import EnvironmentInfo from 'soresu-form/web/va/EnvironmentInfo'
import { LegacyTranslations } from 'soresu-form/web/va/types'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import { Logo } from './Logo'

type VaLoginTopBarProps = {
  lang: 'fi' | 'sv'
  translations: LegacyTranslations
  environment: EnvironmentApiResponse
  isJotpaTopBar: boolean
}

const VaLoginTopbar = (props: VaLoginTopBarProps) => {
  const { environment, lang, translations, isJotpaTopBar } = props

  return (
    <section id="topbar">
      <div id="top-container">
        <Logo showJotpaLogo={isJotpaTopBar} lang={lang} />
        <div className="topbar-right">
          <h1 id="topic">
            <LocalizedString
              translations={translations.form}
              translationKey="heading"
              lang={lang}
            />
          </h1>
          <div>
            <div className="important-info">
              <EnvironmentInfo environment={environment} lang={lang} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VaLoginTopbar
