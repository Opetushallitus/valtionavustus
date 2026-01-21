import React, { ChangeEventHandler, MouseEventHandler } from 'react'
import Translator from '../Translator'
import BasicFieldComponent, { BasicFieldComponentProps } from './BasicFieldComponent'

interface RadioButtonProps extends BasicFieldComponentProps {
  options: any[]
  onChange: ChangeEventHandler<any>
  onClick?: MouseEventHandler<HTMLInputElement>
}

export default class RadioButton extends BasicFieldComponent<RadioButtonProps> {
  render() {
    const props = this.props
    const radiobuttons = []
    const classStr = this.resolveClassName()

    if (props.options) {
      for (let i = 0; i < props.options.length; i++) {
        const inputId = props.htmlId + '.radio.' + i
        const optionValue = props.options[i].value

        const label = new Translator(props.options[i]).translate('label', props.lang, optionValue)

        radiobuttons.push(
          <input
            type="radio"
            id={inputId}
            key={props.htmlId + '.' + optionValue}
            name={props.htmlId}
            disabled={props.disabled}
            value={optionValue}
            onChange={props.onChange}
            onClick={props.onClick}
            checked={optionValue === props.value}
          />
        )
        radiobuttons.push(
          <label
            key={props.htmlId + '.' + optionValue + '.label'}
            className={classStr}
            htmlFor={inputId}
          >
            {label}
          </label>
        )
      }
    }
    return (
      <div className="soresu-radio">
        {this.label()}
        {radiobuttons}
      </div>
    )
  }
}
