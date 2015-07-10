import React from 'react'
import Translator from '../Translator.js'
import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class RadioButton extends BasicFieldComponent {
  render() {
    const field = this.props.field
    const radiobuttons = [];

    if (field.options) {
      for (var i=0; i < field.options.length; i++) {
        const label = new Translator(field.options[i]).translate("label", this.props.lang, field.options[i].value)
        radiobuttons.push(<input type="radio" id={this.props.htmlId + ".radio." + i}
                                 key={this.props.htmlId + "." + field.options[i].value}
                                 name={this.props.htmlId}
                                 required={field.required}
                                 disabled={this.props.disabled}
                                 value={field.options[i].value}
                                 onChange={e => this.props.onChange(this.props.field, e.target.value)}
                                 checked={field.options[i].value === this.props.value ? true: null} />)
        radiobuttons.push(
          <label key={this.props.htmlId + "." + field.options[i].value + ".label"}
                 htmlFor={this.props.htmlId + ".radio." + i}>
            {label}
          </label>
        )
      }
    }
    return (<div>
      {this.label()}
      {radiobuttons}
    </div>)
  }
}
