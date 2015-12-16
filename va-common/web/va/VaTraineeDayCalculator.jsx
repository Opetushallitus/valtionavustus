import React from 'react'

// Koulutettavapäivälaskuri in finnish
export default class VaTraineeDayCalculator extends React.Component {
  render() {
    const props = this.props;
    return (
      <div>
        <input type="radio" id={props.htmlId + ".studypoints-checkbox"}
                            key={props.htmlId + ".studypoints-checkbox"}
                            name="study-points"
                            value="study-points"
                            checked="false" />
      </div>
    )
  }
}
