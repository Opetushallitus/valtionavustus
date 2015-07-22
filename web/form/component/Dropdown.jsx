import React from 'react'
import Translator from '../Translator.js'
import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class Dropdown extends BasicFieldComponent {
  render() {
    const props = this.props;
    const options = [];
    if (field.options) {
      for (var i=0; i < field.options.length; i++) {
        const label = new Translator(field.options[i]).translate("label", props.lang, field.options[i].value)
        options.push(
          <option key={props.htmlId + "." + field.options[i].value}
                  value={field.options[i].value}
                  disabled={props.disabled}>
            {label}
          </option>
        )
      }
    }
    return (<div className="soresu-dropdown">
      {this.label()}
      <select id={props.htmlId}
              name={props.htmlId}
              disabled={props.disabled}
              controller={props.controller}
              onChange={e => props.onChange(props.field, e.target.value)}
              value={props.value}>
        {options}
      </select>
    </div>)
  }
}