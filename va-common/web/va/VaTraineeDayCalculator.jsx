import React from 'react'

import BasicFieldComponent from 'soresu-form/web/form/component/BasicFieldComponent.jsx'
import RadioButton from 'soresu-form/web/form/component/RadioButton.jsx'
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'
import Translator from 'soresu-form/web/form/Translator.js'

// Koulutettavapäivälaskuri in finnish
export default class VaTraineeDayCalculator extends React.Component {
  constructor(props) {
    super(props)
    this.translator = new Translator(props.translations.form["trainee-day-calculator"])
  }

  render() {
    const props = this.props
    const htmlId = props.htmlId
    const onChange = (param) => {
      console.log("Param", param)
    }
    const selectionOptions = [
      {
        "value": "op",
        "label": {
          "fi": "Opintopisteinä",
          "sv": "TODO SV Opintopisteinä"
        }
      },
      {
        "value": "kp",
        "label": {
          "fi": "Koulutuspäivinä",
          "sv": "TODO SV Koulutuspäivinä"
        }
      }
    ]
    return (
      <div id={htmlId}>
        <table className="va-trainee-day-fieldset">
        <thead><tr>
          <th>{this.translator.translate("scope-type", this.props.lang)}</th>
          <th>{this.translator.translate("scope", this.props.lang)}</th>
          <th>{this.translator.translate("person-count", this.props.lang)}</th>
        </tr></thead>
        <tbody><tr>
          <td>
            <RadioButton options={selectionOptions}
                          onChange={onChange}
                          value="kp"
                          translations={{}}
                          lang={this.props.lang} />
          </td>
          <td>
            <BasicTextField onChange={onChange}
                            value=""
                            translations={{}}
                            size="extra-extra-small"
                            lang={this.props.lang} />
          </td>
          <td>
            <BasicTextField onChange={onChange}
                            value=""
                            translations={{}}
                            size="extra-extra-small"
                            lang={this.props.lang} />
            </td>
        </tr></tbody>
        <tfoot>
        <tr><td colSpan="3">{this.translator.translate("total", this.props.lang)}: 0</td></tr>
        </tfoot>
      </table>
      </div>
    )
  }
}
