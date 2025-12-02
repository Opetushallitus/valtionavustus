import React, { ChangeEventHandler, FocusEventHandler } from 'react'
import BasicFieldComponent, { BasicFieldComponentProps } from './BasicFieldComponent'

export interface BasicTextFieldProps extends BasicFieldComponentProps {
  maxLength?: number
  onBlur?: FocusEventHandler<any>
  onChange?: ChangeEventHandler<any>
  size?: string
}

export default class BasicTextField<T> extends BasicFieldComponent<BasicTextFieldProps & T> {
  baseClassName() {
    return 'soresu-text-field'
  }
  render() {
    const props = this.props
    const sizeNumber = Number.isInteger(props.size) ? Number(props.size) : undefined
    const classStr = this.resolveClassName()
    return (
      <div className={this.resolveClassName(this.baseClassName())}>
        {this.label(classStr)}
        <input
          type={'text'}
          size={sizeNumber}
          id={props.htmlId}
          name={props.htmlId}
          maxLength={props.maxLength}
          value={props.value}
          disabled={props.disabled}
          onBlur={props.onBlur}
          onChange={props.onChange}
        />
      </div>
    )
  }
}
