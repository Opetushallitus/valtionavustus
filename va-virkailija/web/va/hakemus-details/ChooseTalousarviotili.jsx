import React from 'react'
import _ from 'lodash'

import RadioRow from './RadioRow.jsx'

export default class ChooseTalousarviotili extends React.Component {
  constructor(props) {
    super(props)
    this.state = {isOpen: false}
  }

  toggleOpen() {
    this.setState({isOpen: !this.state.isOpen})
  }

  render() {
    const selectedTalousarviotili = this.props.selectedTalousarviotili
    const availableTalousarviotilit = this.props.availableTalousarviotilit
    const allowEditing = this.props.allowEditing && availableTalousarviotilit.length > 1

    const title = describeTitle(selectedTalousarviotili, availableTalousarviotilit)

    const isOpen = allowEditing && (this.state.isOpen || !selectedTalousarviotili)

    const onToggleList = allowEditing ? () => this.toggleOpen() : null

    const onSelection = allowEditing
      ? event => {
          this.props.onSelection(event.target.value)
          this.setState({isOpen: false})
        }
      : null

    return (
      <div className="hakemus-arviointi-section">
        <label>Talousarviotili (momentti):</label>
        <a onClick={onToggleList} disabled={!allowEditing}>{title}</a>
        <div className="radio-container radio-container--talousarviotili" hidden={!isOpen}>
          {availableTalousarviotilit.map(tt => {
            const isSelected = tt === selectedTalousarviotili
            return <RadioRow key={tt} name="talousarviotili" value={tt} isSelected={isSelected} allowEditing={allowEditing} onChange={onSelection}/>
          })}
        </div>
      </div>
    )
  }
}

const describeTitle = (selectedTalousarviotili, availableTalousarviotilit) => {
  if (selectedTalousarviotili) {
    return selectedTalousarviotili
  } else if (_.isEmpty(availableTalousarviotilit)) {
    return "Valitse ensin rahoitusalue"
  } else {
    return "Ei valittu"
  }
}
