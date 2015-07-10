import React from 'react'
import Translator from '../Translator.js'
import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class Dropdown extends BasicFieldComponent {
  render() {
    const field = this.props.field
    const options = [];
    if (field.options) {
      for (var i=0; i < field.options.length; i++) {
        const label = new Translator(field.options[i]).translate("label", this.props.lang, field.options[i].value)
        options.push(
          <option key={this.props.htmlId + "." + field.options[i].value}
                  value={field.options[i].value}
                  disabled={this.props.disabled}>
            {label}
          </option>
        )
      }
    }
    return (<div className="soresu-dropdown">
      {this.label()}
      <select id={this.props.htmlId}
              name={this.props.htmlId}
              required={field.required}
              disabled={this.props.disabled}
              model={this.props.model}
              onChange={e => this.props.onChange(this.props.field, e.target.value)}
              value={this.props.value}>
        {options}
      </select>
    </div>)
  }
}