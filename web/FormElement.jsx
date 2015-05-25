import React from 'react'
import LocalizedString from './LocalizedString.jsx'

class TextField extends React.Component {
  render() {
    var field = this.props.field
    return (<input id={field.id} type="text" name={field.id}></input>)
  }
}

class TextArea extends React.Component {
  render() {
    var field = this.props.field
    return (<textarea id={field.id} rows="4" cols="50" />)
  }
}

export default class FormElement extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    var field = this.props.field;
    var displayAs = field["display-as"]
    console.log("field", field)
    var input = ""
    // TODO: fix json conversion in backend to produce javascript style
    // fields
    if (displayAs == "text-field") {
      input = <TextField {...this.props} />
    } else if (displayAs == "text-area") {
      input = <TextArea {...this.props} />
    }
    return (
      <div>
        <label><LocalizedString data={field.label} lang={this.props.lang} /></label>
        {input}
        <p><LocalizedString data={field.description} lang={this.props.lang} /></p>
      </div>
    )
  }
}
