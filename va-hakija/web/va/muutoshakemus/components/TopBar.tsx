import React from 'react'
import { useTranslations } from '../TranslationContext'
import { TopBarNotification } from './TopBarNotification'
import {AppContext} from '../store/context'
import { isEqual, omit } from 'lodash'

type TopBarProps = {
  env: string
  onSend: () => void
}

export function TopBar({ env, onSend }: TopBarProps) {
  const { t } = useTranslations()
  const { state } = React.useContext(AppContext)

  function isSavedYhteyshenkiloStateEqualToLocalYhteyshenkilo(): boolean {
    return isEqual(
      omit(state.yhteyshenkilo, ['validationError']),
      omit(state.lastSave?.yhteyshenkilo, ['validationError'])
    )
  }

  function allChangesSaved(): boolean {
    if (!state.jatkoaika && !state.yhteyshenkilo) return true
    return isEqual(state.jatkoaika, state.lastSave?.jatkoaika) && isSavedYhteyshenkiloStateEqualToLocalYhteyshenkilo()
  }

  function formContainsValidationError(): boolean {
    return !!state.yhteyshenkilo?.validationError
  }

  return (
    <section id="topbar">
      <div id="top-container">
        <img id="logo" src="img/logo-240x68@2x.png" width="240" height="68" alt="Opetushallitus / Utbildningsstyrelsen" />
        <div className="topbar-right">
          <div className="topbar-title-and-save-status">
            <h1 id="topic">{t.hakemus}</h1>
          </div>
          <div>
            <div className="important-info">
              <div className="environment-info">
                <div className="environment-info__name">{env}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="muutospyynto-button-container">
          <button
            disabled={allChangesSaved() || formContainsValidationError()}
            id="send-muutospyynto-button"
            type="submit"
            onClick={onSend}>
            {t.send}
          </button>
          <TopBarNotification />
        </div>
      </div>
    </section>
  )
}
