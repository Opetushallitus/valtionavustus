import React, { Component } from 'react'
import _ from "lodash"
import rejectedReasonsByLanguage from './rejectedReasonsByLanguage.json'
export default class Perustelut extends React.Component {

  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const perustelut = _.get(hakemus, "arvio.perustelut","")
    const controller = this.props.controller
    const setReason = (reason) => controller.setArvioPerustelut(hakemus, reason)
    const onChange = (event) => setReason(event.target.value)
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
          <textarea id="perustelut" rows="5" disabled={!allowEditing} value={perustelut} title={perustelut}
                    onChange={onChange}/>
        </div>
      </div>
    )
  }
}