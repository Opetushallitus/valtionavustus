import React from 'react'
import LocalizedString from './LocalizedString.jsx'
import _ from 'lodash'

export default class FormElementError extends React.Component {
  render() {
    const id = this.props.fieldId + "-error"
    if(this.props.validationErrors) {
      const errors = []
      for (var i=0; i < this.props.validationErrors.length; i++) {
        const error = this.props.validationErrors[i].error
        const translations = _.get(this.props.translations.errors, error, {default: error})
        errors.push(<LocalizedString key={error} data={translations} lang={this.props.lang} />)
      }
      return (<div id={id} className="error">{errors}</div>)
    }
    return (<span id={id} className="error"/>)
  }
}
