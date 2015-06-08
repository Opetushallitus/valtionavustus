import React from 'react'
import FormElement from './FormElement.jsx'
import _ from 'lodash'

export default class Form extends React.Component {

  render() {
    const form = this.props.form
    const fields = form.content
    const lang = this.props.lang
    const model = this.props.model
    const values = this.props.values
    const validationErrors = this.props.validationErrors
    const translations = this.props.translations

    return (
      <form>
        <fieldset>
          {
            fields.map(function(field) {
              if (field.type == "formField") {
                const value = _.get(values, field.id, "")
                const fieldErrors = _.get(validationErrors, field.id, [])
                return <FormElement validationErrors={fieldErrors} translations={translations} model={model} lang={lang} key={field.id} value={value} field={field} />
              }
            })
          }
        </fieldset>
      </form>
    )
  }
}
