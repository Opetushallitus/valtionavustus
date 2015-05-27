import React from 'react'
import FormElement from './FormElement.jsx'
import LocalizedString from './LocalizedString.jsx'
import _ from 'lodash'

import {GET, POST, DELETE} from './request'

export default class Form extends React.Component {

  render() {
    var name = this.props.form.content.name
    var fields = this.props.form.content.fields
    var lang = this.props.lang
    var model = this.props.model
    var values = this.props.values

    return (
      <section>
        <h1><LocalizedString data={name} lang={lang}/></h1>
        {
          fields.map(function(field) {
            var value = _.get(values, field.id, "")
            return <FormElement model={model} lang={lang} key={field.id} value={value} field={field} />
          })
        }
        <input type="submit" onClick={model.save} />
      </section>
    )
  }
}
