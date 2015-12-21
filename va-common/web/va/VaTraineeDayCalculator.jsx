import React from 'react'

import BasicFieldComponent from 'soresu-form/web/form/component/BasicFieldComponent.jsx'
import CheckboxButton from 'soresu-form/web/form/component/CheckboxButton.jsx'

// Koulutettavapäivälaskuri in finnish
export default class VaTraineeDayCalculator extends React.Component {
  render() {
    const props = this.props;
    const onChange = (param) => {
      console.log("Param", param)
    }
    const selectionOptions = [
      {
        "value": "fi",
        "label": {
          "fi": "Suomi",
          "sv": "Finska"
        }
      },
      {
        "value": "sv",
        "label": {
          "fi": "Ruotsi",
          "sv": "Svenska"
        }
      }
    ]
    return (
      <CheckboxButton options={selectionOptions}
                      onChange={onChange}
                      value="fi"
                      translations={this.props.translations}
                      lang={this.props.lang} />
    )
  }
}
