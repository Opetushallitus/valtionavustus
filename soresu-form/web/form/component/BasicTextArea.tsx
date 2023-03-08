import React, { ChangeEventHandler, FocusEventHandler } from 'react'
import _ from 'lodash'
import LocalizedString from './LocalizedString'
import BasicSizedComponent, { BasicSizedComponentProps } from './BasicSizedComponent'

interface BasicTextAreaProps extends BasicSizedComponentProps {
  maxLength: number
  onBlur: FocusEventHandler<any>
  onChange: ChangeEventHandler<any>
}

export default class BasicTextArea extends BasicSizedComponent<BasicTextAreaProps> {
  render() {
    const props = this.props
    const length = _.isUndefined(props.value) ? 0 : props.value.length
    const lengthLeft = props.maxLength - length
    const classStr = this.resolveClassName()
    return (
      <div className="soresu-text-area">
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
