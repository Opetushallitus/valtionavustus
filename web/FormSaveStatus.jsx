import React from 'react'
import FormElementError from './FormElementError.jsx'
import LocalizedString from './LocalizedString.jsx'
import _ from 'lodash'

export default class FormSaveStatus extends React.Component {
  render() {
    const saveStatus = this.props.saveStatus
    const submitErrors = this.props.submitErrors
    const translations = this.props.translations
    const lang = this.props.lang

    var status;
    if (submitErrors && submitErrors.length > 0) {
      status = <FormElementError fieldId="submit" validationErrors={submitErrors} translations={translations} lang={lang}/>
    } else if(saveStatus.changes) {
      status = <span className="info"><LocalizedString translations={translations.form} translationKey="saving" lang={lang}/></span>
    }
    else {
      status = <span className="info" hidden={!saveStatus.saveTime}><LocalizedString translations={translations.form} translationKey="saved" lang={lang}/></span>
    }

    return(<div className="status">{status}</div>)
  }
}
