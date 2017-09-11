import React from 'react'

import _ from 'lodash'

import Translator from '../Translator'
import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class CheckboxButton extends BasicFieldComponent {
  render() {
    const props = this.props;
    const selectionButtons = [];
    const classStr = this.resolveClassName()
    if (props.options) {
      for (var i=0; i < props.options.length; i++) {
        const optionValue = props.options[i].value
        const checked = _.contains(props.value, optionValue)
        const label = new Translator(props.options[i]).translate("label", props.lang, optionValue)
        selectionButtons.push(<input type="checkbox" id={props.htmlId + ".checkbox." + i}
                                 key={props.htmlId + "." + optionValue}
                                 name={props.htmlId}
                                 disabled={props.disabled}
                                 value={optionValue}
                                 onChange={props.onChange}
                                 checked={checked} />)
        selectionButtons.push(
          <label key={props.htmlId + "." + optionValue + ".label"}
                 className={classStr}
                 htmlFor={props.htmlId + ".checkbox." + i}>
            {label}
          </label>
        )
      }
    }
    return (<div className="soresu-checkbox">
      {this.label()}
      {selectionButtons}
    </div>)
  }
}
