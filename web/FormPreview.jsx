import React from 'react'
import FormPreviewElement from './FormPreviewElement.jsx'
import _ from 'lodash'

export default class FormPreview extends React.Component {

  render() {
    const fields = this.props.form.content
    const lang = this.props.lang
    const model = this.props.model
    const values = this.props.values

    return (
      <div className="preview">
        {
          fields.map(function(field) {
            if (field.type == "formField") {
              const value = _.get(values, field.id, "")
              return <FormPreviewElement model={model} lang={lang} key={field.id} value={value} field={field} />
            }
          })
        }
      </div>
    )
  }
}
