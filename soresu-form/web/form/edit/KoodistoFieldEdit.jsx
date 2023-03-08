import React, { Component } from 'react'
import _ from 'lodash'

import DropdownList from 'react-widgets/DropdownList'
import 'react-widgets/styles.css'

import { EditComponent, FieldEditComponent } from './EditComponent.jsx'

export default class KoodistoFieldEdit extends FieldEditComponent {
  render() {
    const htmlId = this.props.htmlId
    const koodistos = this.props.koodistos
    const koodistoChoice = this.renderKoodistoChoice(
      htmlId + '-koodisto',
      'Koodisto',
      (x) => x.params,
      koodistos
    )
    const inputTypeChoice = this.renderInputElementType(htmlId)
    const propertyEditors = [
      <div key="koodisto-choice" className="koodisto-dropdown-container">
        Valitse koodisto {koodistoChoice}
      </div>,
      inputTypeChoice,
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
        // Delay this.props.koodistosLoader() to avoid setState during render
        setTimeout(this.props.koodistosLoader)
      }
      return <span>Ei koodistoja.</span>
    }
    const koodistoSelectionOnChange = (selectedKoodisto) => {
      this.fieldValueUpdater(valueGetter, 'koodisto', selectedKoodisto)()
    }
    return (
      <KoodistoDropdown
        id={htmlId}
        name={name}
        koodisto={valueGetter(field).koodisto}
        koodistosList={koodistos.content}
        onChange={koodistoSelectionOnChange}
      />
    )
  }

  renderInputElementType(htmlId) {
    const field = this.props.field
    const inputTypeAlternatives = ['radioButton', 'checkboxButton', 'dropdown']
    const inputTypeAlternativeButtons = []
    for (let i = 0; i < inputTypeAlternatives.length; i++) {
      inputTypeAlternativeButtons.push(
        <input
          type="radio"
          id={htmlId + '.inputType.' + i}
          key={'input-type-input-' + i}
          name={htmlId + '-input-type'}
          value={inputTypeAlternatives[i]}
          onChange={this.fieldValueUpdater((x) => x.params, 'inputType')}
          checked={inputTypeAlternatives[i] === field.params.inputType}
        />
      )
      inputTypeAlternativeButtons.push(
        <label
          className="soresu-input-type-selection"
          key={'input-type-label-' + i}
          htmlFor={htmlId + '.inputType.' + i}
        >
          {EditComponent.fieldTypeInFI(inputTypeAlternatives[i])}
        </label>
      )
    }
    return (
      <span className="soresu-edit-property shift-left" key={htmlId + 'input-type-edit-property'}>
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
    const onChange = this.props.onChange
    const defaultOpen = _.isUndefined(koodisto)
    const messages = {
      filterPlaceholder: '',
      emptyList: 'Ei koodistoja',
      emptyFilter: 'Ei tuloksia',
    }

    return (
      <div className="koodisto-dropdown">
        <DropdownList
          defaultOpen={defaultOpen}
          dataKey="uri"
          textField="name"
          data={koodistosList}
          defaultValue={koodisto}
          renderValue={KoodistoEntry}
          filter="contains"
          onChange={onChange}
          messages={messages}
          placeholder="Valitse koodisto"
        />
      </div>
    )
  }
}

function KoodistoEntry({ item }) {
  return <span>{item.name}</span>
}
