import * as React from "react"
import {Translations} from '../MuutoshakemusApp'

type TopBarProps = {
  t: Translations,
  env: string,
  onSend: () => void
}

export function TopBar({ t, env, onSend }: TopBarProps) {

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
            id="send-muutospyynto-button"
            type="submit"
            onClick={onSend}>
            {t.send}
          </button>
        </div>
      </div>
    </section>
  )
}
