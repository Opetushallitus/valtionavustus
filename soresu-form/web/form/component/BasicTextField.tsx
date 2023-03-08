import React, { ChangeEventHandler, FocusEventHandler } from 'react'
import BasicSizedComponent, { BasicSizedComponentProps } from './BasicSizedComponent'

export interface BasicTextFieldProps extends BasicSizedComponentProps {
  maxLength?: number
  onBlur?: FocusEventHandler<any>
  onChange?: ChangeEventHandler<any>
}

export default class BasicTextField<T> extends BasicSizedComponent<BasicTextFieldProps & T> {
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
