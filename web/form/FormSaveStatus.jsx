import React from 'react'
import LocalizedString from './element/LocalizedString.jsx'

export default class FormSaveStatus extends React.Component {
  render() {
    const saveStatus = this.props.saveStatus
    const translations = this.props.translations
    const lang = this.props.lang

    const status = saveStatus.saveInProgress ?
      <span className="info"><LocalizedString translations={translations.form} translationKey="saving" lang={lang}/></span> :
      <span className="info" hidden={!saveStatus.saveTime}><LocalizedString translations={translations.form} translationKey="saved" lang={lang}/></span>

    return(<div className="status">{status}</div>)
  }
}
