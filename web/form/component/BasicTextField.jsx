import React from 'react'
import BasicFieldComponent from './BasicFieldComponent.jsx'
import BasicSizedComponent from './BasicSizedComponent.jsx'

export default class BasicTextField extends BasicSizedComponent {
  constructor(props) {
    super(props)
    this.inputType = "text"
  }

  baseClassName() {
    return "soresu-text-field"
  }

  render() {
    const props = this.props
    const sizeNumber = Number.isInteger(props.size) ? props.size : undefined
    const classStr = this.resolveClassName()
    return (<div className={this.resolveClassName(this.baseClassName())}>
      {this.label(classStr)}
      <input
        type={this.inputType}
        className={classStr}
        size={sizeNumber}
        id={props.htmlId}
        name={props.htmlId}
        maxLength={props.maxLength}
        value={props.value}
        disabled={props.disabled}
        onBlur={props.onBlur}
        onChange={props.onChange}
        />
    </div>)
  }
}