import React from 'react'
import FormElement from './FormElement.jsx'
import FormElementError from './FormElementError.jsx'
import LocalizedString from './LocalizedString.jsx'
import _ from 'lodash'

export default class Form extends React.Component {

  render() {
    var form = this.props.form
    var fields = form.content.fields
    var lang = this.props.lang
    var model = this.props.model
    var values = this.props.values
    var validationErrors = this.props.validationErrors
    var translations = this.props.translations
    var submitErrors = _.get(validationErrors, "submit", [])

    return (
      <form className="pure-form pure-form-stacked">
        <fieldset>
          {
            fields.map(function(field) {
              var value = _.get(values, field.id, "")
              var fieldErrors = _.get(validationErrors, field.id, [])
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
