import React from 'react'
import ClassNames from 'classnames'

import FormEditComponent from './FormEditComponent.jsx'

export default class EditComponent extends React.Component {

  static fieldTypeInFI(fieldType){
    const translations = {
      "h1": "Otsikko",
      "p": "Ohjeteksti",
      "dateRange": "Päivämääräväli",
      "bulletList": "Lista",
      "textField": "Vapaa tekstikenttä",
      "textArea": "Vapaa tekstialue",
      "emailField": "Sähköposti",
      "moneyField": "Rahasumma",
      "finnishBusinessIdField": "Y-tunnus",
      "iban": "IBAN tilinumero",
      "bic": "BIC pankkitunnus",
      "dropdown": "Alasvetovalikko",
      "radioButton": "Monivalinta (yksi valittavissa)",
      "checkboxButton": "Monivalinta (useampi valittavissa)",
      "namedAttachment": "Nimetty liitetiedosto",
      "theme": "Lomakkeen osio",
      "fieldset": "Kenttärivi",
      "growingFieldset": "Kasvava kenttälista",
      "growingFieldsetChild": "Kasvavan kenttälistan rivi",
      "vaFocusAreas": "Painopistealueet",
      "vaEmailNotification": "Sähköposti, johon lähetetään tiedoksi",
      "vaProjectDescription": "Tavoite-Toiminta-Tulos",
      "vaBudget": "Rahoituslaskelma",
      "vaBudgetItemElement": "Rahoituslaskelman rivi",
      "vaSummingBudgetElement": "Rahoituslaskelman summarivi",
      "vaBudgetSummaryElement": "Rahoituslaskelman yhteenveto"
    }
    return translations[fieldType] ? translations[fieldType] : field.fieldType
  }

  fieldValueUpdater(valueContainerGetter, valueName, newValue) {
    const field = this.props.field
    const formEditorController = this.props.formEditorController
    return e => {
      formEditorController.editField(field.id, valueContainerGetter, valueName, typeof newValue === 'undefined' ? e.target.value : newValue)
    }

  }

  renderTranslationTable(htmlId, name, valueGetter) {
    const field = this.props.field
    if(typeof valueGetter(field) === 'undefined') {
      return undefined
    }
    return (
      <table className="translation">
        <thead><th>{name}</th><th>{name + " ruotsiksi"}</th></thead>
        <tr>
          <td><textarea onChange={this.fieldValueUpdater(valueGetter, "fi")} name={htmlId+"-fi"} value={valueGetter(field).fi}></textarea></td>
          <td><textarea onChange={this.fieldValueUpdater(valueGetter, "sv")} name={htmlId+"-sv"} value={valueGetter(field).sv}></textarea></td>
        </tr>
      </table>
    )
  }

  renderEditable(fieldSpecificEditInEnd, fieldSpecificEditInMiddle) {
    const field = this.props.field
    const formEditorController = this.props.formEditorController
    const htmlId = this.props.htmlId
    var labelEdit = this.renderTranslationTable(htmlId + "-label", this.labelName(), x => x.label)
    var helpTextEdit = this.renderTranslationTable(htmlId + "-help-text", "Ohjeteksti", x => x.helpText)
    var requiredEdit = undefined
    if(typeof field.required != 'undefined') {
      requiredEdit = (
        <span className="soresu-edit-property">
          <input onChange={this.fieldValueUpdater(x => x, "required", !field.required)} type="checkbox" id={htmlId+"-required"} name={htmlId+"-required"} checked={field.required}/>
          <label htmlFor={htmlId+"-required"}> Pakollinen tieto</label>
        </span>
      )
    }
    const removeFieldOnClick = e => { formEditorController.removeField(field) }
    const removeField = FormEditComponent.fieldTypeMapping()[field.fieldType] ?
        <span onClick={removeFieldOnClick} className="soresu-edit soresu-field-remove">Poista</span> :
        undefined
    return (
        <div key={htmlId} className={this.className()}>
          <h3>{EditComponent.fieldTypeInFI(field.fieldType)}</h3>
          {removeField}
          {labelEdit}
          {requiredEdit}
          {fieldSpecificEditInMiddle}
          {helpTextEdit}
          {fieldSpecificEditInEnd}
        </div>
    )
  }

  labelName() {
    return "Kysymys"
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
    return super.renderEditable(this.props.wrappedElement)
  }
}

export class InfoElementEditWrapper extends EditComponent {
  labelName() {
    return "Otsikko"
  }

  render() {
    const htmlId = this.props.htmlId
    const textEdit = super.renderTranslationTable(htmlId + "-text", "Teksti", x => x.text)
    return super.renderEditable(
      <div>
        {textEdit}
        {this.props.wrappedElement}
      </div>
    )
  }
}

export class AppendableEditWrapper extends EditComponent {
  labelName() {
    return "Otsikko"
  }

  render() {
    const formEditorController = this.props.formEditorController
    const field = this.props.field
    const addableElements = _.keys(FormEditComponent.fieldTypeMapping())
    const addElementButtons = []
    for (var i = 0; i < addableElements.length; i++) {
      addElementButtons.push(<button key={i} className="soresu-edit" onClick={createOnclick(addableElements[i])}>{EditComponent.fieldTypeInFI(addableElements[i])}</button>)
    }

    return super.renderEditable(
      <div>
         {this.props.wrappedElement}
         <div className="soresu-field-add">
           <span>Lisää kysymys</span>
           {addElementButtons}
         </div>
      </div>
    )

    function createOnclick(fieldType) {
      return e => {
        e.preventDefault()
        formEditorController.addChildFieldTo(field, fieldType)
      }
    }
  }

  className() {
    const classNames = ClassNames("soresu-edit", "soresu-appendable-wrapper-edit", this.sizeClassName())
    return !_.isEmpty(classNames) ? classNames : undefined
  }
}

export class TextFieldEdit extends EditComponent {
  sizeLabel() {
    return "Leveys"
  }

  render() {
    const htmlId = this.props.htmlId
    const field = this.props.field
    const maxLengthEdit = (
      <span className="soresu-edit-property">
        <label htmlFor={htmlId+"-max-length"}>Merkkirajoitus</label>
        <input type="number" min="1" max="9999" maxLength="4" onChange={this.fieldValueUpdater(x => x.params, "maxlength")} id={htmlId+"-max-length"} name={htmlId+"-max-length"} value={field.params.maxlength}/>
      </span>
    )
    const sizeAlternatives = ["small", "medium", "large"]
    const sizeTexts = {
      "small": "S",
      "medium": "M",
      "large": "L"
    }
    const sizeAlternenativeButtons = []
    for (var i = 0; i < sizeAlternatives.length; i++) {
      sizeAlternenativeButtons.push(
        <input type="radio" id={htmlId + ".size." + i}
               key={"size-input-" + i}
               name={htmlId + "-size"}
               value={sizeAlternatives[i]}
               onChange={this.fieldValueUpdater(x => x.params, "size")}
               checked={sizeAlternatives[i] === field.params.size ? true: null} />
      )
      sizeAlternenativeButtons.push(
        <label key={"size-label-" + i} htmlFor={htmlId + ".size." + i}>
          {sizeTexts[sizeAlternatives[i]]}
        </label>
      )
    }
    const sizeEdit = (
      <span className="soresu-edit-property">
        <label>{this.sizeLabel()}</label>
        {sizeAlternenativeButtons}
      </span>
    )

    return super.renderEditable(
        undefined,
        <span>
          {sizeEdit}
          {maxLengthEdit}
        </span>
    )
  }
}

export class TextAreaEdit extends TextFieldEdit {
  sizeLabel() {
    return "Korkeus"
  }
}

export class MultipleChoiceEdit extends EditComponent {
  render() {
    const field = this.props.field
    const formEditorController = this.props.formEditorController
    const optionElements = _.map(field.options, renderOption)
    const appendOption = e => { formEditorController.appendOption(field) }
    return super.renderEditable(
      <div className="soresu-radio-button-edit">
        {optionElements}
        <button className="soresu-edit" onClick={appendOption}>Lisää vastausvaihtoehto {field.options.length + 1}</button>
      </div>)

    function renderOption(option) {
      const indexOfOption = _.indexOf(field.options, option)
      const labelGetter = f => { return f.options[indexOfOption].label }
      const valueGetter = f => { return f.options[indexOfOption] }
      function createOnChange(lang) {
        return e => {
          super.fieldValueUpdater(labelGetter, lang)(e)
          const finnishLabelValue = labelGetter(field).fi
          super.fieldValueUpdater(valueGetter, "value", finnishLabelValue)(e)
        }
      }
      const removeOption = e => {
        formEditorController.removeOption(field, option)
      }
      const title = "Vastausvaihtoehto " + (indexOfOption + 1)
      return <div className="soresu-radio-option-edit" key={field.id + "-option-" + indexOfOption}>
               <span className="soresu-radio-option-edit-title">{title}</span>
               <input type="text" placeholder="Vastausvaihtoehto" onChange={createOnChange("fi")} value={labelGetter(field).fi}/>
               <input type="text" placeholder="Vastausvaihtoehto ruotsiksi" onChange={createOnChange("sv")} value={labelGetter(field).sv}/>
               <span onClick={removeOption} className="soresu-edit soresu-field-remove"></span>
             </div>
    }
  }
}
