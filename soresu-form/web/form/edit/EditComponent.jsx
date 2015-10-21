import React from 'react'
import ClassNames from 'classnames'

export default class EditComponent extends React.Component {
  render(fieldSpecificEdit) {
    const field = this.props.field
    const formEditorController = this.props.formEditorController
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
    var requiredEdit = undefined
    if(typeof field.required != 'undefined') {
      requiredEdit = (
       <div>
         <label htmlFor={htmlId+"-required"}>Pakollinen tieto</label>
         <input type="checkbox" id={htmlId+"-required"} name={htmlId+"-required"} checked={field.required}/>
       </div>
      )
    }
    const removeField = e => { formEditorController.removeField(field) }
    return (
      <div key={htmlId} className={this.className()}>
        <h3>{this.componentName()}</h3>
        <span onClick={removeField} className="soresu-edit soresu-field-remove">Poista</span>
        {labelEdit}
        {requiredEdit}
        {helpTextEdit}
        {fieldSpecificEdit}
      </div>
    )
  }

  componentName() {
    return this.props.field.fieldClass + ": " + this.props.field.fieldType
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

export class EditWrapper extends EditComponent {
  render() {
    return super.render(this.props.wrappedElement)
  }
}

export class AppendableEditWrapper extends EditComponent {
  render() {
    const editableComponent = super.render(this.props.wrappedElement)
    const formEditorController = this.props.formEditorController
    const field = this.props.field
    const onClick = e => {
      e.preventDefault()
      formEditorController.addChildFieldTo(field)
    }
    return <div className="soresu-edit soresu-appendable-wrapper-edit">
             {editableComponent}
             <a className="soresu-edit soresu-add-field" onClick={onClick}>Lisää tekstikenttä</a>
           </div>
  }
}

export class TextFieldEdit extends EditComponent {
  componentName() {
    return "Vapaa teksti"
  }
}
