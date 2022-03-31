import { Component } from 'react';
import HelpTooltip from "../HelpTooltip"
import RadioRow from './RadioRow.jsx'

export default class ChooseRahoitusalue extends Component {
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
    const helpTexts = this.props.helpTexts

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
        <label>Koulutusaste:</label>
        <a onClick={onToggleList} disabled={!allowEditing}>{title}</a>
        <HelpTooltip testId={"tooltip-koulutusaste"} content={helpTexts["hankkeen_sivu__arviointi___koulutusaste"]} direction={"arviointi-slim"} />
        <div className="radio-container radio-container--rahoitusalue" hidden={!isOpen}>
          {availableRahoitusalueet.map(ra => {
            const isSelected = ra.rahoitusalue === selectedRahoitusalue
            return <RadioRow
                       key={ra.rahoitusalue}
                       name="rahoitusalue"
                       value={ra.rahoitusalue}
                       isSelected={isSelected}
                       allowEditing={allowEditing}
                       onChange={onSelection}/>
          })}
        </div>
      </div>
    )
  }
}
