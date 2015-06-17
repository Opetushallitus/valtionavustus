import React from 'react'
import LocalizedString from './LocalizedString.jsx'

export default class FormSaveStatus extends React.Component {
  render() {
    const saveStatus = this.props.saveStatus
    const translations = this.props.translations
    const lang = this.props.lang

    var status;
    if (!saveStatus.hakemusId) {
      status = ""
    } else if(saveStatus.changes) {
      status = <span className="info"><LocalizedString translations={translations.form} translationKey="saving" lang={lang}/></span>
    }
    else {
      status = <span className="info" hidden={!saveStatus.saveTime}><LocalizedString translations={translations.form} translationKey="saved" lang={lang}/></span>
    }

    return(<div className="status">{status}</div>)
  }
}
