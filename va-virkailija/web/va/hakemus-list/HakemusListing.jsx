import Bacon from 'baconjs'
import _ from 'lodash'
import HttpUtil from '../HttpUtil.js'
import Dispatcher from '../Dispatcher.js'
import React, { Component } from 'react'

export default class HakemusListing extends Component {
  render() {
    const hakemusList = this.props.hakemusList
    const hakemusElements = _.map(hakemusList, hakemus => {
      return <HakemusRow hakemus={hakemus} key={hakemusList.indexOf(hakemus)}/> })
    return (
      <table key="hakemusListing">
        {hakemusElements}
      </table>
    )
  }
}

class HakemusRow extends Component {
  render() {
    const key = this.props.key
    const hakemus = this.props.hakemus
    return <tr key={key}>
      <td>{JSON.stringify(hakemus)}</td>
    </tr>
  }
}