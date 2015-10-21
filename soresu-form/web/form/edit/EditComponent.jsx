import React from 'react'
import ClassNames from 'classnames'

export default class EditComponent extends React.Component {
  render(fieldSpecificEdit) {
    const field = this.props.field
    const htmlId = this.props.htmlId
    var labelEdit = undefined
    if(field.label) {
      labelEdit = (
        <table className="translation">
          <thead><th>Kysymys</th><th>Kysymys ruotsiksi</th></thead>
          <tr>
            <td><textarea name={htmlId+"-label-fi"} value={field.label.fi}></textarea></td>
            <td><textarea name={htmlId+"-label-sv"} value={field.label.sv}></textarea></td>
          </tr>
        </table>
      )
    }
    var helpTextEdit = undefined
    if(field.helpText) {
      helpTextEdit = (
        <table className="translation">
          <thead><th>Ohjeteksti</th><th>Ohjeteksti ruotsiksi</th></thead>
          <tr>
            <td><textarea name={htmlId+"-help-text-fi"} value={field.helpText.fi}></textarea></td>
            <td><textarea name={htmlId+"-help-text-sv"} value={field.helpText.sv}></textarea></td>
          </tr>
        </table>
      )
    }
    return (
      <div className={this.className()}>
        <h3>{this.componentName()}</h3>
        {labelEdit}
        {helpTextEdit}
        {fieldSpecificEdit}
      </div>
    )
  }

  componentName() {
    return this.props.field.fieldType
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
  componentName() {
    return "Vapaa teksti"
  }
}
