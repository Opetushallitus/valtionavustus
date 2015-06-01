import React from 'react'
import FormElement from './FormElement.jsx'
import _ from 'lodash'

export default class Form extends React.Component {

  render() {
    var form = this.props.form
    var fields = form.content.fields
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
        { this.props.valuesId ? <a target="preview" href={"/?preview=true&form=" + form.id + "&submission=" + this.props.valuesId}>Tallennettu versio</a> : null}
      </form>
    )
  }
}
