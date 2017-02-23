import React, { Component } from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'

const RadioRow = ({value,currentValue,allowEditing, onChange}) =>{
  const checked = value === currentValue
  const rowClass = ClassNames('radio-row',{
    'radio-row--selected': checked,
    'radio-row--unselected': !checked
  })

  return (
    <div className={rowClass}>
      <label>{value}
        <input type="radio"
               name="rahoitusalue"
               value={value}
               disabled={!allowEditing}
               checked={checked}
               onChange={onChange}

        />
      </label>
    </div>
  )
}

export default class ChooseRahoitusalue extends React.Component {

  constructor(props) {
    super(props)
    this.state = {open: false}
  }

  toggleOpen(){
    this.setState({open: !this.state.open})
  }

  render() {
    const avustushaku = this.props.avustushaku
    if(_.isEmpty(avustushaku.content.rahoitusalueet)) {
      return null
    }
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const currentRahoitusalue = hakemus.arvio ? hakemus.arvio.rahoitusalue : undefined
    const controller = this.props.controller
    const onRahoitusalueChange = allowEditing ? (event) => {
      controller.setHakemusRahoitusalue(hakemus, event.target.value)
      this.setState({open: false})
    } : null
    const toggleList = allowEditing ?  () => this.toggleOpen() : null
    const title = currentRahoitusalue || "Ei valittu"
    const open = this.state.open || (!currentRahoitusalue && allowEditing)
    return (
      <div className="hakemus-arviointi-section">
        <label>Rahoitusalue:</label>
        <a onClick={toggleList} disabled={!allowEditing}>{title}</a>
        <div className="radio-container radio-container--rahoitusalue" hidden={!open}>
          {avustushaku.content["rahoitusalueet"].map((row)=><RadioRow key={row.rahoitusalue} value={row.rahoitusalue} currentValue={currentRahoitusalue} onChange={onRahoitusalueChange} allowEditing={allowEditing}/>)}
        </div>
      </div>
    )
  }
}