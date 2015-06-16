import React from 'react'
import FormElement from './FormElement.jsx'
import InfoElement from './InfoElement.jsx'
import WrapperElement from './WrapperElement.jsx'
import _ from 'lodash'

export default class Form extends React.Component {

  render() {
    const form = this.props.form
    const fields = form.content
    const lang = this.props.lang
    const model = this.props.model
    const values = this.props.values
    const infoElementValues = this.props.infoElementValues.content
    const validationErrors = this.props.validationErrors
    const translations = this.props.translations

    const renderField = function (field) {
      if (field.type == "formField") {
        const value = _.get(values, field.id, "")
        const fieldErrors = _.get(validationErrors, field.id, [])
        return <FormElement validationErrors={fieldErrors} translations={translations} model={model} lang={lang} key={field.id} value={value} field={field} />
      } else if (field.type == "infoElement") {
        return <InfoElement key={field.id} field={field} values={infoElementValues} lang={lang} translations={translations} />
      } else if (field.type == "wrapperElement") {
        const children = []
        for (var i=0; i < field.children.length; i++) {
          children.push(renderField(field.children[i]))
        }
        return <WrapperElement key={field.id} field={field} lang={lang} children={children} />
      }
    }

    return (
      <form>
        {
          fields.map(renderField)
        }
      </form>
    )
  }
}
