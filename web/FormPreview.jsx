import React from 'react'
import FormPreviewElement from './FormPreviewElement.jsx'
import _ from 'lodash'

export default class FormPreview extends React.Component {

  render() {
    var fields = this.props.form.content.fields
    var lang = this.props.lang
    var model = this.props.model
    var values = this.props.values

    return (
      <div className="preview">
        {
          fields.map(function(field) {
            var value = _.get(values, field.id, "")
            return <FormPreviewElement model={model} lang={lang} key={field.id} value={value} field={field} />
          })
        }
      </div>
    )
  }
}
