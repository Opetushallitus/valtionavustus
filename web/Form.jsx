import React from 'react'
import FormElement from './FormElement.jsx'
import FormElementError from './FormElementError.jsx'
import LocalizedString from './LocalizedString.jsx'
import _ from 'lodash'

export default class Form extends React.Component {

  render() {
    const form = this.props.form
    const fields = form.content.fields
    const lang = this.props.lang
    const model = this.props.model
    const values = this.props.values
    const validationErrors = this.props.validationErrors
    const translations = this.props.translations
    const submitErrors = _.get(validationErrors, "submit", [])

    return (
      <form className="pure-form pure-form-stacked">
        <fieldset>
          {
            fields.map(function(field) {
              const value = _.get(values, field.id, "")
              const fieldErrors = _.get(validationErrors, field.id, [])
              return <FormElement validationErrors={fieldErrors} translations={translations} model={model} lang={lang} key={field.id} value={value} field={field} />
            })
          }
          <FormElementError fieldId="submit" validationErrors={submitErrors} translations={translations} lang={lang}/>
          <button type="submit" onClick={model.save} className="pure-button pure-button-primary"><LocalizedString data={translations.form.submit} lang={lang}/></button>
          { this.props.valuesId ? <a target="preview" href={"/?preview=true&form=" + form.id + "&submission=" + this.props.valuesId}><LocalizedString data={translations.form.preview} lang={lang}/></a> : null}
        </fieldset>
      </form>
    )
  }
}
