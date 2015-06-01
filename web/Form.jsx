import React from 'react'
import FormElement from './FormElement.jsx'
import _ from 'lodash'

export default class Form extends React.Component {

  render() {
    var fields = this.props.form.content.fields
    var lang = this.props.lang
    var model = this.props.model
    var values = this.props.values

    return (
      <form onSubmit={model.save}>
        {
          fields.map(function(field) {
            var value = _.get(values, field.id, "")
            return <FormElement model={model} lang={lang} key={field.id} value={value} field={field} />
          })
        }
        <input type="submit"/>
      </form>
    )
  }
}
