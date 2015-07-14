import React from 'react'
import BasicSizedComponent from './BasicSizedComponent.jsx'

export default class BasicTextField extends BasicSizedComponent {
  constructor(props) {
    super(props)
    this.fieldtype = "text"
  }

  baseClassName() {
    return "soresu-text-field"
  }

  render() {
    const sizeNumber = Number.isInteger(this.param("size")) ? this.param("size") : undefined
    const classStr = this.resolveClassName()
    const props = this.props
    return (<div className={this.resolveClassName(this.baseClassName())}>
      {this.label(classStr)}
      <input
        type={this.fieldtype}
        id={props.htmlId}
        name={props.htmlId}
        size={sizeNumber}
        maxLength={this.param("maxlength")}
        model={props.model}
        value={props.value}
        className={classStr}
        disabled={props.disabled}
        onChange={e => props.onChange(props.field, e.target.value)}
        />
    </div>)
  }
}