import React from 'react'
import ClassNames from 'classnames'

export default class EditComponent extends React.Component {
  render(edit) {
    return (
      <div className={this.className()}>
        {edit}
      </div>
    )
  }

  className() {
    const classNames = ClassNames("soresu-edit", "soresu-field-edit", this.sizeClassName())
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  sizeClassName() {
    if (this.param("size") && !Number.isInteger(this.param("size"))) return this.param("size")
    else return undefined
  }

  param(param, defaultValue) {
    if (!this.props.field.params) return defaultValue
    if (this.props.field.params[param] !== undefined) return this.props.field.params[param]
    return defaultValue
  }
}

export class TextFieldEdit extends EditComponent {
  render() {
    const field = this.props.field
    const htmlId = this.props.htmlId
    return super.render(
      <div>
        <h3>Vapaa teksti</h3>
        <label htmlFor={htmlId} htmlClass="required">Kysymys</label>
        <input id={htmlId} size="80" value={field.label.fi}></input>
      </div>
    )
  }
}
