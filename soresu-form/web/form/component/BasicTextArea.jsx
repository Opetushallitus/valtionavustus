import React from 'react'
import _ from 'lodash'
import LocalizedString from './LocalizedString.jsx'
import BasicFieldComponent from './BasicFieldComponent.jsx'
import BasicSizedComponent from './BasicSizedComponent.jsx'

export default class BasicTextArea extends BasicSizedComponent {
  render() {
    const props = this.props
    const length = _.isUndefined(props.value) ? 0 : props.value.length
    const lengthLeft = props.maxLength - length
    const classStr = this.resolveClassName()
    return (<div className="soresu-text-area">
              {this.label(classStr)}
              <textarea
                id={props.htmlId}
                name={props.htmlId}
                maxLength={props.maxLength}
                value={props.value}
                className={classStr}
                disabled={props.disabled}
                onBlur={props.onBlur}
                onChange={props.onChange} />
      <div id={props.htmlId + ".length"} className="length-left">
        {lengthLeft + " "}
        <LocalizedString translations={props.translations.form} translationKey="lengthleft" lang={props.lang}/>
      </div>
    </div>)
  }
}
