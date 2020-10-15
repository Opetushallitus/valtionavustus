import * as React from "react"

type TopBarProps = { title: string, env: string }

export function TopBar({ title, env }: TopBarProps) {
  return (
    <section id="topbar">
      <div id="top-container">
        <img id="logo" src="img/logo-240x68@2x.png" width="240" height="68" alt="Opetushallitus / Utbildningsstyrelsen" />
        <div className="topbar-right">
          <div className="topbar-title-and-save-status">
            <h1 id="topic">{title}</h1>
          </div>
          <div>
            <div className="important-info">
              <div className="environment-info">
                <div className="environment-info__name">{env}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
