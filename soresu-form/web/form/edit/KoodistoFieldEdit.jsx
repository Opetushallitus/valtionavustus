import React, { Component } from 'react'
import _ from 'lodash'

import ReactWidgets from 'react-widgets'

import moment from 'moment-timezone'

import {EditComponent, FieldEditComponent} from './EditComponent.jsx'

export default class KoodistoFieldEdit extends FieldEditComponent {
  render() {
    const htmlId = this.props.htmlId
    const koodistos = this.props.koodistos
    const koodistoChoice = this.renderKoodistoChoice(htmlId + "-koodisto", "Koodisto", x => x.params, koodistos)
    const inputTypeChoice = this.renderInputElementType(htmlId)
    const propertyEditors = [
      <div key="koodisto-choice" className="koodisto-dropdown-container">Valitse koodisto {koodistoChoice}</div>,
      inputTypeChoice
    ]
    return super.renderEditable(undefined, propertyEditors)
  }

  renderKoodistoChoice(htmlId, name, valueGetter, koodistos) {
    const field = this.props.field
    if (koodistos.loading) {
      return <span>Ladataan...</span>
    }
    if (!koodistos.content) {
      if (this.props.koodistosLoader) {
        this.props.koodistosLoader()
      }
      return <span>Ei koodistoja.</span>
    }
    const koodistoSelectionOnChange = selectedKoodisto => {
      this.fieldValueUpdater(valueGetter, "koodisto", selectedKoodisto)()
    }
    return <KoodistoDropdown id={htmlId}
                             name={name}
                             koodisto={valueGetter(field).koodisto}
                             koodistosList={koodistos.content}
                             onChange={koodistoSelectionOnChange} />
  }

  renderInputElementType(htmlId) {
    const field = this.props.field
    const inputTypeAlternatives = ["radioButton", "checkboxButton", "dropdown"]
    const inputTypeAlternativeButtons = []
    for (var i = 0; i < inputTypeAlternatives.length; i++) {
      inputTypeAlternativeButtons.push(
        <input type="radio" id={htmlId + ".inputType." + i}
               key={"input-type-input-" + i}
               name={htmlId + "-input-type"}
               value={inputTypeAlternatives[i]}
               onChange={this.fieldValueUpdater(x => x.params, "inputType")}
               checked={inputTypeAlternatives[i] === field.params.inputType} />
      )
      inputTypeAlternativeButtons.push(
        <label className="soresu-input-type-selection" key={"input-type-label-" + i} htmlFor={htmlId + ".inputType." + i}>
          {EditComponent.fieldTypeInFI(inputTypeAlternatives[i])}
        </label>
      )
    }
    return (
      <span className="soresu-edit-property shift-left" key={htmlId+"input-type-edit-property"}>
        <label>Syöttökentän tyyppi</label>
        <div>
          <fieldset className="soresu-radiobutton-group soresu-radiobutton-group--vertical">
            {inputTypeAlternativeButtons}
          </fieldset>
        </div>
      </span>
    )
  }
}

export class KoodistoDropdown extends Component {
  render() {
    const koodistosList = this.props.koodistosList
    const koodisto = this.props.koodisto
    const koodistoToText = koodistoItem => koodistoItem.name
    const onChange = this.props.onChange
    const defaultOpen = _.isUndefined(koodisto)
    const messages = {
      filterPlaceholder: '',
      emptyList: 'Ei koodistoja',
      emptyFilter: 'Ei tuloksia'
    }
    return <div className="koodisto-dropdown">
             <ReactWidgets.DropdownList defaultOpen={defaultOpen}
                                        valueField="uri"
                                        textField={koodistoToText}
                                        data={koodistosList}
                                        defaultValue={koodisto}
                                        valueComponent={KoodistoEntry}
                                        caseSensitive={false}
                                        minLength={3}
                                        filter='contains'
                                        duration={0}
                                        onChange={onChange}
                                        messages={messages}
                                        placeholder="Valitse koodisto"/>
           </div>
  }
}

class KoodistoEntry extends React.Component {
  render() {
    const name = this.props.item.name
    return <span>{name}</span>
  }
}
