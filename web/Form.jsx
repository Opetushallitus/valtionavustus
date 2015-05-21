import React from 'react'
import FormElement from './FormElement.jsx'

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
    console.log("Data", this.state.data)
    var fields = this.state.data.fields;

    return (
      <section>
        <h1>{ this.state.data.name.fi }</h1>
        {
          fields.map(function(field) {
            return <FormElement key={field.id} field={field} />
          })
        }
      </section>
    )
  }
}
