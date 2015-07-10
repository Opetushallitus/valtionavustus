import React from 'react'
import _ from 'lodash'
import LocalizedString from './LocalizedString.jsx'
import BasicSizedComponent from './BasicSizedComponent.jsx'

export default class BasicTextArea extends BasicSizedComponent {
  render() {
    const field = this.props.field
    const length = _.isUndefined(this.props.value) ? 0 : this.props.value.length
    const lengthLeft = this.param("maxlength") - length
    const classStr = this.resolveClassName()
    return (<div>
      {this.label(classStr)}
              <textarea
                id={this.props.htmlId}
                name={this.props.htmlId}
                required={field.required}
                maxLength={this.param("maxlength")}
                model={this.props.model}
                value={this.props.value}
                className={classStr}
                disabled={this.props.disabled}
                onChange={e => this.props.onChange(this.props.field, e.target.value)} />
      <div className="length-left-spacer"></div>
      <div id={this.props.htmlId + ".length"} className="length-left">
        {lengthLeft + " "}
        <LocalizedString translations={this.props.translations.form} translationKey="lengthleft" lang={this.props.lang}/>
      </div>
    </div>)
  }
}