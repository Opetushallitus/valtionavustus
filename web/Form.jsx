import React from 'react'
import FormElement from './FormElement.jsx'
import LocalizedString from './LocalizedString.jsx'

import {GET, POST, DELETE} from './request'

export default class Form extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    var name = this.props.form.content.name
    var fields = this.props.form.content.fields
    var lang = this.props.lang

    return (
      <section>
        <h1><LocalizedString data={name} lang={lang}/></h1>
        <form method="POST" action="/api/form_submission/1">
          {
            fields.map(function(field) {
              return <FormElement lang={lang} key={field.id} field={field} />
            })
          }
          <input type="submit"/>
        </form>
      </section>
    )
  }
}
