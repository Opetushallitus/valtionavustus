import React, { ChangeEventHandler, FocusEventHandler } from 'react'
import LocalizedString from './LocalizedString'
import BasicFieldComponent, { BasicFieldComponentProps } from './BasicFieldComponent'

interface BasicTextAreaProps extends BasicFieldComponentProps {
  maxLength: number
  onBlur: FocusEventHandler<any>
  onChange: ChangeEventHandler<any>
  size?: string
}

export default class BasicTextArea extends BasicFieldComponent<BasicTextAreaProps> {
  render() {
    const props = this.props
    const length = props.value === undefined ? 0 : props.value.length
    const lengthLeft = props.maxLength - length
    const classStr = this.resolveClassName()
    return (
      <div className={`soresu-text-area${typeof props.size === 'string' ? ` ${props.size}` : ''}`}>
        {this.label(classStr)}
        <textarea
          id={props.htmlId}
          name={props.htmlId}
          maxLength={props.maxLength}
          value={props.value}
          disabled={props.disabled}
          onBlur={props.onBlur}
          onChange={props.onChange}
        />
        <div id={props.htmlId + '.length'} className="length-left">
          {lengthLeft + ' '}
          <LocalizedString
            translations={props.translations.form}
            translationKey="lengthleft"
            lang={props.lang}
          />
        </div>
      </div>
    )
  }
}
