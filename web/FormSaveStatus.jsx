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
    return(<div className="status">
      <span className="info" hidden={!saveStatus.changes}><LocalizedString translations={translations.form} translationKey="saving" lang={lang}/></span>
      <span className="info" hidden={saveStatus.changes || !saveStatus.saveTime}><LocalizedString translations={translations.form} translationKey="saved" lang={lang}/></span>
      <FormElementError fieldId="submit" validationErrors={submitErrors} translations={translations} lang={lang}/>
    </div>)
  }
}
