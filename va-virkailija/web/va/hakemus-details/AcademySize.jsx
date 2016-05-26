import React, { Component } from 'react'
import Bacon from 'baconjs'

export default class AcademySize extends React.Component {

  constructor(props) {
    super(props)
    this.state = initialState(props)
    this.changeBus = new Bacon.Bus()
    this.changeBus.debounce(1000).onValue(([hakemus, value]) => { this.props.controller.setHakemusAcademysize(hakemus, value) })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.setState(initialState(nextProps))
    }
  }

  render() {
    const {avustushaku, hakemus, allowEditing, controller} = this.props
    if(!avustushaku.is_academysize) {
      return null
    }
    const onChange = (event) => {
      const value = event.target.value
      this.setState({value: value})
      const valueInt = parseInt(value)
      if(value.length>0){
        this.setState({invalid:isNaN(valueInt)})
      }
      if(valueInt){
        this.changeBus.push([hakemus, valueInt])
      }
    }
    return (
      <div className="hakemus-arviointi-section hakemus-arviointi-section--academy-size">
        <label>Oppilaitoksen koko:</label>
        <input type="number" className={this.state.invalid ? 'error input-number-sm' : 'input-number-sm'} value={this.state.value} onChange={onChange} disabled={!allowEditing}/>
      </div>
    )
  }
}

function initialState(props){
  const value = _.get(props.hakemus, "arvio.academysize") || 0
  return {value: value,invalid:false}
}
