import React from 'react'
import FormElement from './FormElement.jsx'
import LocalizedString from './LocalizedString.jsx'

import {GET, POST, DELETE} from './request'

export default class Form extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      data: {
        name: {fi: "", sv: ""},
        fields: []
      }
    }
  }

  render() {
    var name = this.props.form.name
    var fields = this.props.form.fields
    var lang = this.props.lang

    return (
      <section>
        <h1><LocalizedString data={name} lang={lang}/></h1>
        {
          fields.map(function(field) {
            return <FormElement lang={lang} key={field.id} field={field} />
          })
        }
      </section>
    )
  }
}
