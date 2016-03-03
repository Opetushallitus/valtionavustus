import React, { Component } from 'react'
import _ from "lodash"

export default class Perustelut extends React.Component {

  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const perustelut = _.get(hakemus, "arvio.perustelut","")
    const controller = this.props.controller
    const onChange = (event) => controller.setArvioPerustelut(hakemus, event.target.value)

    return <div className="value-edit">
      <label htmlFor="perustelut">Perustelut hakijalle</label>
      <textarea id="perustelut" rows="5" disabled={!allowEditing} value={perustelut} title={perustelut}
                onChange={onChange}/>
    </div>
  }
}