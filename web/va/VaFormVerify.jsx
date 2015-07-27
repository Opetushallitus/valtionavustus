import React from 'react'

import LocalizedString from '../form/component/LocalizedString.jsx'
import VaFormVerifyTopbar from './VaFormVerifyTopbar.jsx'

export default class VaFormVerify extends React.Component {
  render() {
    const state = this.props.state
    const lang = state.configuration.lang
    const urlCreator = this.props.urlCreator
    function closeWindow() {
      window.location = urlCreator.existingSubmissionEditUrl(state.avustushakuId, state.hakemus.id, lang)
    }
    const ok = state.hakemus.status && state.hakemus.status !== "draft_unverified"
    const translations = state.configuration.translations.verification
    const translationsByStatus = ok ? translations.ok : translations.failed
    return(
      <div id="verification">
        <VaFormVerifyTopbar state={state}/>
        <div id="container">
          <h1><LocalizedString translations={translationsByStatus} translationKey="message" lang={lang}/></h1>
          <div><LocalizedString translations={translationsByStatus} translationKey="info" lang={lang}/></div>
          <button hidden={!ok} className="soresu-text-button" onClick={closeWindow} type="button"><LocalizedString translations={translations.ok} translationKey="close" lang={lang}/></button>
        </div>
      </div>
    )
  }
}