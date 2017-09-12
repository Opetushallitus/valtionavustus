import React from "react"
import ClassNames from "classnames"
import slug from "speakingurl"
import _ from "lodash"

import FormEditorController from "./FormEditController"
import MathUtil from "../../MathUtil"
import SyntaxValidator from "../SyntaxValidator"

const hiddenFields = [
  "theme", "growingFieldsetChild", "fieldset"
]

export class EditComponent extends React.Component {

  static fieldTypeInFI(fieldType){
    const translations = {
      "h1": "Otsikko",
      "h3": "Väliotsikko",
      "link": "Linkki",
      "p": "Ohjeteksti",
      "dateRange": "Päivämääräväli",
      "bulletList": "Lista",
      "textField": "Tekstikenttä",
      "textArea": "Tekstialue",
      "emailField": "Sähköposti",
      "moneyField": "Rahasumma",
      "finnishBusinessIdField": "Y-tunnus",
      "iban": "IBAN tilinumero",
      "bic": "BIC pankkitunnus",
      "dropdown": "Pudotusvalikko",
      "radioButton": "Lista, yksi valittavissa",
      "checkboxButton": "Lista, monta valittavissa",
      "namedAttachment": "Liitetiedosto",
      "theme": "Lomakkeen osio",
      "fieldset": "Kenttärivi",
      "growingFieldset": "Kasvava kenttälista",
      "growingFieldsetChild": "Kasvavan kenttälistan rivi",
      "koodistoField": "Koodistokenttä",
      "tableField": "Taulukkokenttä",
      "vaFocusAreas": "Painopistealueet",
      "vaEmailNotification": "Sähköposti, johon lähetetään tiedoksi",
      "vaProjectDescription": "Tavoite-Toiminta-Tulos",
      "vaBudget": "Rahoituslaskelma",
      "vaBudgetItemElement": "Rahoituslaskelman rivi",
      "vaSummingBudgetElement": "Rahoituslaskelman summarivi",
      "vaBudgetSummaryElement": "Rahoituslaskelman yhteenveto",
      "vaTraineeDayCalculator": "Koulutettavapäivälaskuri",
      "vaTraineeDayTotalCalculator": "Koulutettavapäivät yhteensä"
    }
    return translations[fieldType] ? translations[fieldType] : fieldType
  }

  fieldValueUpdater(valueContainerGetter, valueName, newValue) {
    const field = this.props.field
    const formEditorController = this.props.formEditorController
    return e => {
      formEditorController.editField(field.id, valueContainerGetter, valueName, typeof newValue === "undefined" ? e.target.value : newValue)
    }

  }

  static fieldClassWithValidation(value, validator, extraClassName) {
    const invalidClassName = validator ? validator(value) ? "error" : undefined : undefined
    const classNamesSet = ClassNames(invalidClassName, extraClassName)
    return _.isEmpty(classNamesSet) ? undefined : classNamesSet
  }

  renderTranslationTable(htmlId, name, valueGetter, extraClassName, validator) {
    const field = this.props.field
    if(typeof valueGetter(field) === "undefined") {
      return undefined
    }
    const classNamesFi = EditComponent.fieldClassWithValidation(valueGetter(field).fi, validator, extraClassName)
    const classNamesSv = EditComponent.fieldClassWithValidation(valueGetter(field).sv, validator, extraClassName)
    return (
      <table className="translation">
        <thead><tr><th>{name + " suomeksi"}</th><th>{name + " ruotsiksi"}</th></tr></thead>
        <tbody>
          <tr>
            <td>
              <textarea
                className={classNamesFi}
                onChange={this.fieldValueUpdater(valueGetter, "fi")}
                name={htmlId+"-fi"}
                value={valueGetter(field).fi}>
              </textarea>
            </td>
            <td>
              <textarea
                className={classNamesSv}
                onChange={this.fieldValueUpdater(valueGetter, "sv")}
                name={htmlId+"-sv"}
                value={valueGetter(field).sv}>
              </textarea>
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  handleOnAddClick(fieldType, e) {
    const {field, formEditorController} = this.props
    e.preventDefault()
    formEditorController.addChildFieldAfter(field, fieldType)
  }

  handleOnRemoveFieldClick() {
    const {field, formEditorController} = this.props
    formEditorController.removeField(field)
  }

  handleOnMoveFieldUpClick() {
    this.props.formEditorController.moveField(this.props.field, -1)
  }

  handleOnMoveFieldDownClick() {
    this.props.formEditorController.moveField(this.props.field, 1)
  }

  renderEditable(fieldSpecificEdit) {
    const field = this.props.field
    const htmlId = this.props.htmlId

    const addableFields = Object.keys(
      FormEditorController.addableFieldTypes()
    ).filter(
      t => hiddenFields.indexOf(t) === -1)

    const addElementButtons = addableFields.map((key, i) => (
      <a href="#" key={i} className="soresu-edit" onClick={this.handleOnAddClick.bind(this, key)}>
        {EditComponent.fieldTypeInFI(key)}
      </a>
    ))

    var labelEdit = this.renderTranslationTable(htmlId + "-label", this.labelName(), x => x.label)
    const editFields = addableFields.indexOf(field.fieldType) !== -1 ? (
      <div className="soresu-field-edit-tools">
        <span onClick={this.handleOnMoveFieldUpClick.bind(this)}
          className="soresu-field-move-up soresu-field-edit-button" />
        <span onClick={this.handleOnMoveFieldDownClick.bind(this)}
          className="soresu-field-move-down soresu-field-edit-button" />
        <span onClick={this.handleOnRemoveFieldClick.bind(this)}
          className="soresu-field-remove soresu-field-edit-button">Poista</span>
      </div>) : null

    return (
      <div key={htmlId} className={this.className()}>
        <div className="soresu-field-header">
          <span className="soresu-field-title">
            <h3>{EditComponent.fieldTypeInFI(field.fieldType)}</h3>
          </span>
          <span>
            {editFields}
          </span>
        </div>
        <div className="soresu-field-content">
          {labelEdit}
          {fieldSpecificEdit}
          <div className="soresu-field-add">
            <div className="soresu-field-add-header"></div><div className="soresu-field-adders">{addElementButtons}</div>
          </div>
        </div>
      </div>
    )
  }

  labelName() {
    return "Kysymys"
  }

  className() {
    return ClassNames("soresu-edit", "soresu-field-edit", this.sizeClassName())
  }

  sizeClassName() {
    if (this.param("size") && !Number.isInteger(this.param("size"))) {
      return this.param("size")
    }
    else {
      return undefined
    }
  }

  param(param, defaultValue) {
    if (!this.props.field.params) {
      return defaultValue
    }
    if (this.props.field.params[param] !== undefined) {
      return this.props.field.params[param]
    }
    return defaultValue
  }
}

export class FieldEditComponent extends EditComponent {
  renderEditable(fieldSpecificElementEdit, fieldSpecificPropertyEditors) {
    const field = this.props.field
    const htmlId = this.props.htmlId
    var requiredEdit = undefined
    if(typeof field.required != "undefined") {
      requiredEdit = (
        <span className="soresu-edit-property">
          <input onChange={this.fieldValueUpdater(x => x, "required", !field.required)} type="checkbox" id={htmlId+"-required"} name={htmlId+"-required"} checked={field.required}/>
          <label htmlFor={htmlId+"-required"}> Pakollinen tieto</label>
        </span>
      )
    }
    var helpTextEdit = this.renderTranslationTable(htmlId + "-help-text", "Ohjeteksti", x => x.helpText, "larger-textarea")
    return super.renderEditable(
      <div>
        {helpTextEdit}
        <div className="soresu-edit-properties-line">
          {requiredEdit}
          {fieldSpecificPropertyEditors}
        </div>
        {fieldSpecificElementEdit}
      </div>
    )
  }

}

export class BasicEditWrapper extends EditComponent {
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
    const textEdit = super.renderTranslationTable(htmlId + "-text", "Teksti", x => x.text, "larger-textarea")
    return super.renderEditable(
      <div className="soresu-edit-wrapped-view">
        {textEdit}
      </div>
    )
  }
}

export class AppendableEditWrapper extends EditComponent {
  labelName() {
    return "Otsikko"
  }

  render() {
    return super.renderEditable(
      <div className="soresu-edit-wrapped-view">
        {this.props.wrappedElement}
      </div>
    )
  }

  className() {
    const classNames = ClassNames("soresu-edit", "soresu-appendable-wrapper-edit", this.sizeClassName())
    return !_.isEmpty(classNames) ? classNames : undefined
  }
}

export class BasicFieldEdit extends FieldEditComponent {
  render() {
    return super.renderEditable()
  }
}

export class LinkEdit extends EditComponent {
  render() {
    const htmlId = this.props.htmlId
    const textEdit = super.renderTranslationTable(htmlId + "-text", "Teksti", x => x.text)
    const hrefEdit = this.renderTranslationTable(htmlId + "-href", "Osoite", x => x.params.href, undefined, SyntaxValidator.validateUrl)
    return super.renderEditable(
      <div>
        {textEdit}
        {hrefEdit}
      </div>
    )
  }
}

export class TextFieldEdit extends FieldEditComponent {
  sizeLabel() {
    return "Koko"
  }

  render() {
    const htmlId = this.props.htmlId
    const field = this.props.field
    const formEditorController = this.props.formEditorController
    const editMaxLength = e => {
      const getter = f => f.params
      const value = MathUtil.isNumeric(e.target.value) ? parseInt(e.target.value) : undefined
      formEditorController.editField(field.id, getter, "maxlength", value)
    }
    const maxLengthEdit = (
      <span className="soresu-edit-property" key={htmlId+"max-length-edit-property"}>
        <label htmlFor={htmlId+"-max-length"}>Merkkirajoitus</label>
        <input type="number" min="1" max="9999" maxLength="4" onChange={editMaxLength} id={htmlId+"-max-length"} name={htmlId+"-max-length"} value={field.params.maxlength}/>
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
          checked={sizeAlternatives[i] === field.params.size} />
      )
      sizeAlternenativeButtons.push(
        <label className="soresu-size-selection" key={"size-label-" + i} htmlFor={htmlId + ".size." + i}>
          {sizeTexts[sizeAlternatives[i]]}
        </label>
      )
    }
    const sizeEdit = (
      <span className="soresu-edit-property shift-left" key={htmlId+"size-edit-property"}>
        <label>{this.sizeLabel()}</label>
        <fieldset className="soresu-sizebutton-group">
          {sizeAlternenativeButtons}
        </fieldset>
      </span>
    )
    const fieldSpecificEditors = [ sizeEdit, maxLengthEdit ]

    return super.renderEditable(undefined, fieldSpecificEditors)
  }
}

export class TextAreaEdit extends TextFieldEdit {
  sizeLabel() {
    return "Korkeus"
  }
}

export class MultipleChoiceEdit extends FieldEditComponent {

  removeOption(field, option) {
    this.props.formEditorController.removeOption(field, option)
  }

  appendOption(field) {
    this.props.formEditorController.appendOption(field)
  }

  renderOption(field, option) {
    const indexOfOption = _.indexOf(field.options, option)
    const labelGetter = f => f.options[indexOfOption].label
    const valueGetter = f => f.options[indexOfOption]
    const createOnChange = lang => {
      return e => {
        this.fieldValueUpdater(labelGetter, lang)(e)
        if (lang === "fi") {
          this.fieldValueUpdater(valueGetter, "value", slug(e.target.value))(e)
        }
      }
    }

    const title = "Vastausvaihtoehto " + (indexOfOption + 1)
    return (
      <div className="soresu-radio-option-edit"
        key={field.id + "-option-" + indexOfOption}>
        <span className="soresu-radio-option-edit-title">
          {title}
        </span>
        <input type="text" placeholder="Vastausvaihtoehto" 
          onChange={createOnChange("fi")} value={labelGetter(field).fi}/>
        <input type="text" placeholder="Vastausvaihtoehto ruotsiksi"
          onChange={createOnChange("sv")} value={labelGetter(field).sv}/>
        <span
          onClick={this.removeOption.bind(this, field, option)}
          className="soresu-edit soresu-field-remove soresu-field-edit-icon"
        />
      </div>
    )
  }

  render() {
    const field = this.props.field
    return super.renderEditable(
      <div className="soresu-radio-button-edit">
        {field.options.map(option => this.renderOption(field, option))}
        <button
          type="button"
          className="soresu-edit"
          onClick={this.appendOption.bind(this, field)}>
            Lisää vastausvaihtoehto {field.options.length + 1}
        </button>
      </div>)
  }
}
