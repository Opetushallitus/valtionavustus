import React from 'react'

import BasicFieldComponent from 'soresu-form/web/form/component/BasicFieldComponent.jsx'

// Koulutettavapäivälaskuri in finnish
export default class VaTraineeDayCalculator extends React.Component {
  render() {
    const props = this.props;
    return (
      <div className="soresu-radio">

        <input type="radio" id={props.htmlId + ".studypoints-checkbox"}
                            key={props.htmlId + ".studypoints-checkbox"}
                            name="study-points"
                            value="study-points"
                            checked="false" />
        <label key={props.htmlId + "." + "studypoints-checkbox.label"}
               htmlFor={props.htmlId + ".studypoints-checkbox"}>
          Opintopisteet
        </label>

        <input type="radio" id={props.htmlId + ".trainingdays-checkbox"}
                            key={props.htmlId + ".trainingdays-checkbox"}
                            name="training-days"
                            value="training-days"
                            checked="" />
        <label key={props.htmlId + "." + "trainingdays-checkbox.label"}
               htmlFor={props.htmlId + ".trainingdays-checkbox"}>
          Koulutuspäivät
        </label>
      </div>
    )
  }
}
