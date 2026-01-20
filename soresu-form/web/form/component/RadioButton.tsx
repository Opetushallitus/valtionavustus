import React, { ChangeEventHandler, MouseEventHandler } from 'react'
import Translator from '../Translator'
import BasicFieldComponent, { BasicFieldComponentProps } from './BasicFieldComponent'

interface RadioButtonProps extends BasicFieldComponentProps {
  options: any[]
  onChange: ChangeEventHandler<any>
}

export default class RadioButton extends BasicFieldComponent<RadioButtonProps> {
  handleClick: MouseEventHandler<HTMLInputElement> = (e) => {
    const target = e.target as HTMLInputElement
    const clickedValue = target.value
    if (clickedValue === this.props.value && !this.props.disabled) {
      // Clicking already-selected option unselects it
      this.props.onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  render() {
    const props = this.props
    const radiobuttons = []
    const classStr = this.resolveClassName()

    if (props.options) {
      for (let i = 0; i < props.options.length; i++) {
        const label = new Translator(props.options[i]).translate(
          'label',
          props.lang,
          props.options[i].value
        )
        radiobuttons.push(
          <input
            type="radio"
            id={props.htmlId + '.radio.' + i}
            key={props.htmlId + '.' + props.options[i].value}
            name={props.htmlId}
            disabled={props.disabled}
            value={props.options[i].value}
            onChange={props.onChange}
            onClick={this.handleClick}
            checked={props.options[i].value === props.value}
          />
        )
        radiobuttons.push(
          <label
            key={props.htmlId + '.' + props.options[i].value + '.label'}
            className={classStr}
            htmlFor={props.htmlId + '.radio.' + i}
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
