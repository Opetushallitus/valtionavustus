import React from 'react'
import BasicSizedComponent from './BasicSizedComponent.jsx'

export default class BasicTextField extends BasicSizedComponent {
  constructor(props) {
    super(props)
    this.fieldtype = "text"
  }

  render() {
    const sizeNumber = Number.isInteger(this.param("size")) ? this.param("size") : undefined
    const classStr = this.resolveClassName()
    const field = this.props.field
    return (<div className={classStr}>
      {this.label(classStr)}
      <input
        type={this.fieldtype}
        id={this.props.htmlId}
        name={this.props.htmlId}
        required={field.required}
        size={sizeNumber}
        maxLength={this.param("maxlength")}
        model={this.props.model}
        value={this.props.value}
        className={classStr}
        disabled={this.props.disabled}
        onChange={e => this.props.onChange(this.props.field, e.target.value)}
        />
    </div>)
  }
}