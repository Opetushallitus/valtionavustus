import React from 'react'
import FormPreviewElement from './FormPreviewElement.jsx'
import InfoElement from './InfoElement.jsx'
import WrapperElement from './WrapperElement.jsx'
import _ from 'lodash'

export default class FormPreview extends React.Component {

  render() {
    const fields = this.props.form.content
    const lang = this.props.lang
    const translations = this.props.translations
    const model = this.props.model
    const values = this.props.values
    const infoElementValues = this.props.infoElementValues.content

    const renderField = function (field) {
      if (field.type == "formField") {
        const value = _.get(values, field.id, "")
        return <FormPreviewElement model={model} lang={lang} key={field.id} value={value} field={field} />
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
      <div className="preview">
        {
          fields.map(renderField)
        }
      </div>
    )
  }
}
