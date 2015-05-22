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

  loadFromServer() {
    var _this = this

    GET(this.props.url, function (data) {
      return _this.setState({ data: data })
    })
  }

  componentDidMount() {
    this.loadFromServer()
  }

  render() {
    var fields = this.state.data.fields
    var lang = this.props.lang

    console.log("Data", this.state.data)
    console.log("Props", this.props)
    console.log("Lang", lang);

    return (
      <section>
        <h1><LocalizedString data={this.state.data.name} lang={lang}/></h1>
        {
          fields.map(function(field) {
            return <FormElement lang={lang} key={field.id} field={field} />
          })
        }
      </section>
    )
  }
}
