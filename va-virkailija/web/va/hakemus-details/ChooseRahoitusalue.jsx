import React from 'react'
import _ from 'lodash'

import RadioRow from './RadioRow.jsx'

export default class ChooseRahoitusalue extends React.Component {
  constructor(props) {
    super(props)
    this.state = {isOpen: false}
  }

  toggleOpen() {
    this.setState({isOpen: !this.state.isOpen})
  }

  render() {
    const selectedRahoitusalue = this.props.selectedRahoitusalue
    const availableRahoitusalueet = this.props.availableRahoitusalueet
    const allowEditing = this.props.allowEditing

    const title = selectedRahoitusalue || "Ei valittu"

    const isOpen = allowEditing && (this.state.isOpen || !selectedRahoitusalue)

    const onToggleList = allowEditing ? () => this.toggleOpen() : null

    const onSelection = allowEditing
      ? event => {
          this.props.onSelection(event.target.value)
          this.setState({isOpen: false})
        }
      : null

    return (
      <div className="hakemus-arviointi-section">
        <label>Rahoitusalue:</label>
        <a onClick={onToggleList} disabled={!allowEditing}>{title}</a>
        <div className="radio-container radio-container--rahoitusalue" hidden={!isOpen}>
          {availableRahoitusalueet.map(ra => {
            const isSelected = ra.rahoitusalue === selectedRahoitusalue
            return <RadioRow key={ra.rahoitusalue} name="rahoitusalue" value={ra.rahoitusalue} isSelected={isSelected} allowEditing={allowEditing} onChange={onSelection}/>
          })}
        </div>
      </div>
    )
  }
}
