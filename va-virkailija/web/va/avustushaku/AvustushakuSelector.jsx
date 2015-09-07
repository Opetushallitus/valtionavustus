import React, { Component } from 'react'

export default class AvustushakuSelector extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    return (
      // TODO: use localizable string
      <div className="avustushaku-name">
         <span>Avustushaku:</span>
         <span>{avustushaku.name.fi}</span>
      </div>
    )
  }
}
