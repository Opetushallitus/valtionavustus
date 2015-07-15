import React from 'react'
import LocalizedString from './LocalizedString.jsx'

export default class ValidationErrorSummary extends React.Component {
  render() {
    const lang = this.props.lang
    const translations = this.props.translations
    const invalidFieldsCount = this.props.invalidFieldsCount
    return (
      <div className="error" hidden={invalidFieldsCount === 0}>
        <LocalizedString translations={translations} translationKey="validation-errors" lang={lang} keyValues={{kpl: invalidFieldsCount}} />
      </div>
    )
  }
}
