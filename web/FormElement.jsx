import React from 'react'
import LocalizedString from './LocalizedString.jsx'

export default class FormElement extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    var field = this.props.field;
    console.log("field", field)
    return (
      <div>
        <label><LocalizedString data={field.label} lang={this.props.lang} /></label>
        <input id={field.id} type="text" name={field.id}></input>
        <p><LocalizedString data={field.description} lang={this.props.lang} /></p>
      </div>
    )
  }
}
