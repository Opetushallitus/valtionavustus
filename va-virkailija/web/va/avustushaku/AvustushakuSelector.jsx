import React, { Component } from 'react'

export default class AvustushakuSelector extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    return (
      <div className="avustushaku-name">
         <label>Avustushaku:</label>
         <span>{avustushaku.name.fi}</span>
      </div>
    )
  }
}
