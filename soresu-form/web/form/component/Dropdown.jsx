import React from 'react'
import Translator from '../Translator'
import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class Dropdown extends BasicFieldComponent {
  render() {
    const props = this.props;
    const options = [];
    if (props.options) {
      for (var i=0; i < props.options.length; i++) {
        const label = new Translator(props.options[i]).translate("label", props.lang, props.options[i].value)
        options.push(
          <option key={props.htmlId + "." + props.options[i].value}
                  value={props.options[i].value}
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
              onChange={props.onChange}
              value={props.value}>
        {options}
      </select>
    </div>)
  }
}
