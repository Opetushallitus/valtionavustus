import Bacon from 'baconjs'
import React, { Component } from 'react'
import _ from "lodash"
import rejectedReasonsByLanguage from './rejectedReasonsByLanguage.json'
export default class Perustelut extends React.Component {

  constructor(props) {
    super(props)
    this.reasonBus = new Bacon.Bus()
    this.reasonBus.debounce(1000).onValue(([hakemus, newReason]) => { this.props.controller.setArvioPerustelut(hakemus, newReason) })
    this.state = {perustelut: getPerustelut(props)}
  }

  reasonUpdated(newReason) {
    this.setState({perustelut: newReason})
    this.reasonBus.push([this.props.hakemus, newReason])
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.setState({perustelut: getPerustelut(nextProps)})
    }
  }

  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    // _.get default value parameter only works with undefined, we get nulls also here
    // and that causes the attribute to go missing from the resulting HTML tag
    // which causes nasty issues with React, unless we explicitly set this to
    // empty string here
    const perustelut = _.get(hakemus, "arvio.perustelut") || ""
    const controller = this.props.controller
    const setReason = (reason) => controller.setArvioPerustelut(hakemus, reason)
    const rejected = _.get(hakemus,"arvio.status","")=="rejected"
    const language= _.find(hakemus.answers,(a)=>a.key=="language")
    const languageValue = language ? language.value : "fi"
    const languageTitle = languageValue=="fi" ? "suomeksi" : "ruotsiksi"
    const rejectedReasons = rejectedReasonsByLanguage[languageValue]
    return(
      <div>
        <div className="value-edit">
          <label htmlFor="perustelut">Perustelut hakijalle <strong>{languageTitle}</strong></label>
          {
            rejected &&
              <div className="radio-container radio-container--perustelut">
                {rejectedReasons.map((reason)=>
                  <div key={reason} className={`radio-row ${reason==perustelut ? "radio-row--selected" : ""}`}>
                    <div onClick={_.partial(setReason,reason)}>{reason}</div>
                  </div>
                )}
              </div>
          }
          <textarea id="perustelut"
                    rows="5"
                    disabled={!allowEditing}
                    value={this.state.perustelut}
                    onChange={(evt) => this.reasonUpdated(evt.target.value)} />
        </div>
      </div>
    )
  }
}

function getPerustelut(props) {
  return _.get(props.hakemus, "arvio.perustelut") || ""
}
