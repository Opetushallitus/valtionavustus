import React from 'react'
import _ from 'lodash'
import LocalizedString from './LocalizedString.jsx'
import BasicFieldComponent from './BasicFieldComponent.jsx'
import BasicSizedComponent from './BasicSizedComponent.jsx'

export default class BasicTextArea extends BasicSizedComponent {
  render() {
    const props = this.props
    const length = _.isUndefined(props.value) ? 0 : props.value.length
    const lengthLeft = this.param("maxlength") - length
    const classStr = this.resolveClassName()
    return (<div className="soresu-text-area">
              {this.label(classStr)}
              <textarea
                id={props.htmlId}
                name={props.htmlId}
                maxLength={this.param("maxlength")}
                model={props.model}
                value={props.value}
                className={classStr}
                disabled={props.disabled}
                onBlur={BasicFieldComponent.checkValueOnBlur(props.field, props.htmlId, props.value, props.onChange, props.model)}
                onChange={e => props.onChange(props.field, e.target.value)} />
      <div id={props.htmlId + ".length"} className="length-left">
        {lengthLeft + " "}
        <LocalizedString translations={props.translations.form} translationKey="lengthleft" lang={props.lang}/>
      </div>
    </div>)
  }
}