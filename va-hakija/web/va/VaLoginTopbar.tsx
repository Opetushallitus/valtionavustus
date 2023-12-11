import type { HakijaAvustusHaku } from 'soresu-form/web/form/types/Form'
import React from 'react'
import LocalizedString from 'soresu-form/web/form/component/LocalizedString'
import EnvironmentInfo from 'soresu-form/web/va/EnvironmentInfo'
import { LegacyTranslations } from 'soresu-form/web/va/types'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import { Logo } from './Logo'
import { isJotpaAvustushaku, isJotpaHakemusCustomizationEnabled } from './jotpa'

type VaLoginTopBarProps = {
  lang: 'fi' | 'sv'
  translations: LegacyTranslations
  environment: EnvironmentApiResponse
  avustushaku: HakijaAvustusHaku
}

const VaLoginTopbar = (props: VaLoginTopBarProps) => {
  const { avustushaku, environment, lang, translations } = props
  const showJotpaLogo =
    isJotpaAvustushaku(avustushaku) && isJotpaHakemusCustomizationEnabled({ environment })

  return (
    <section id="topbar">
      <div id="top-container">
        <Logo showJotpaLogo={showJotpaLogo} lang={lang} />
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
