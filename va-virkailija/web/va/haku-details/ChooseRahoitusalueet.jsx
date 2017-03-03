import _ from 'lodash'
import React, { Component } from 'react'
import Rahoitusalueet from '../data/Rahoitusalueet'

const RahoitusalueRow = ({idPrefix, avustushaku, rahoitusalue, allowEditing, onChange, controller, currentRahoitusalueet}) =>{
  const currentValueIndex = currentRahoitusalueet ? _.findIndex(currentRahoitusalueet, function(o) { return o.rahoitusalue == rahoitusalue; }) : -1
  const talousarviotilit = currentValueIndex > -1 ? currentRahoitusalueet[currentValueIndex].talousarviotilit : [""]
  const talousarvioTiliRows = []
  for (var index=0; index < talousarviotilit.length; index++) {
    const htmlId = idPrefix + index
    const label = index === 0 ? <label>{rahoitusalue}</label> : null
    const addButton = allowEditing && index === talousarviotilit.length -1 && talousarviotilit[index] ?
        <button className="add" tabIndex="-1" onClick={controller.addTalousarviotili(avustushaku, rahoitusalue)}/> : null
    const removeButton = allowEditing && (talousarviotilit[index] || talousarviotilit.length > 1) ?
        <button className="remove" tabIndex="-1" onClick={controller.deleteTalousarviotili(avustushaku, rahoitusalue, index)}/> : null
    talousarvioTiliRows.push(
      <tr key={htmlId}>
        <td>{label}</td>
        <td>
          <input id={htmlId}
                type="text"
                name="talousarviotili"
                value={talousarviotilit[index]}
                disabled={!allowEditing}
                onChange={onChange}/>
        </td>
        <td>
          {addButton}
        </td>
        <td>
          {removeButton}
        </td>
      </tr>
    )
  }
  return (
    <tbody className="rahoitusalue-row">
      {talousarvioTiliRows}
    </tbody>
  )
}

export default class ChooseRahoitusalueet extends React.Component {

  render() {
    const allowEditing = this.props.allowEditing
    const avustushaku = this.props.avustushaku
    const currentRahoitusalueet = avustushaku.content["rahoitusalueet"] ? avustushaku.content["rahoitusalueet"] : []
    const onChange = this.props.onChange
    const controller = this.props.controller
    const rahoitusalueItems = _.times(Rahoitusalueet.length, index => {
      const htmlId = "rahoitusalue-" + index + "-tili-"
      return <RahoitusalueRow key={htmlId} idPrefix={htmlId} controller={controller} onChange={onChange} avustushaku={avustushaku} rahoitusalue={Rahoitusalueet[index]} currentRahoitusalueet={currentRahoitusalueet} allowEditing={allowEditing}/>
    })

    return (
      <div>
        <h3>Rahoitusalueet (lisää momentti ottaaksesi käyttöön)</h3>
        <table id="rahoitusalueet">
          {rahoitusalueItems}
        </table>
      </div>
    )
  }
}
