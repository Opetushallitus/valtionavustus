import React from 'react'
import Translator from '../Translator.js'
import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class RadioButton extends BasicFieldComponent {
  render() {
    const props = this.props;
    const field = props.field
    const radiobuttons = [];

    if (field.options) {
      for (var i=0; i < field.options.length; i++) {
        const label = new Translator(field.options[i]).translate("label", props.lang, field.options[i].value)
        radiobuttons.push(<input type="radio" id={props.htmlId + ".radio." + i}
                                 key={props.htmlId + "." + field.options[i].value}
                                 name={props.htmlId}
                                 disabled={props.disabled}
                                 value={field.options[i].value}
                                 onChange={e => props.onChange(props.field, e.target.value)}
                                 checked={field.options[i].value === props.value ? true: null} />)
        radiobuttons.push(
          <label key={props.htmlId + "." + field.options[i].value + ".label"}
                 htmlFor={props.htmlId + ".radio." + i}>
            {label}
          </label>
        )
      }
    }
    return (<div className="soresu-radio">
      {this.label()}
      {radiobuttons}
    </div>)
  }
}
