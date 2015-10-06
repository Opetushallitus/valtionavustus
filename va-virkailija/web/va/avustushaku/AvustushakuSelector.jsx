import React, { Component } from 'react'

export default class AvustushakuSelector extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const selector = this.props.avustushakuList ? this.createAvustushakuList(this.props.avustushakuList, this.props.controller) : undefined
    return (
      <div className="avustushaku-name">
         <label>Avustushaku:</label>
         <span>{avustushaku.content.name.fi}</span>
         {selector}
      </div>
    )
  }


  createAvustushakuList(avustushakuList, controller) {
    const hakuElements = _.map(avustushakuList, avustushaku => {
      const onClick = event => {
        event.preventDefault()
        location.path = "/avustushaku/" + avustushaku.id
        window.location.href = "/avustushaku/" + avustushaku.id
      }
      return <li key={avustushaku.id}>
        <a href="#" onClick={onClick}>{avustushaku.content.name.fi}</a>
      </li>
    })
    return <ul>
      {hakuElements}
      </ul>
  }
}
