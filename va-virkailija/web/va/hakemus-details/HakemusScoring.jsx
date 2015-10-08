import React, { Component } from 'react'
import _ from 'lodash'

export default class HakemusScoring extends Component {
  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const valintaperusteet = _.get(avustushaku, "content.selection-criteria.items")
    const valintaPerusteRows = _.map(valintaperusteet, peruste => { return <ValintaPerusteRow valintaperuste={peruste}/> } )
    return <div id="hakemus-scoring-container">
             <div className="valintaperuste-list">
               {valintaPerusteRows}
             </div>
           </div>
  }
}

class ValintaPerusteRow {
  render() {
    const valintaperuste = this.props.valintaperuste
    const textInFinnish = valintaperuste.fi
    const textInSwedish = valintaperuste.sv
    return <div className="single-valintaperuste" >
            <div className="valintaperuste-text" title={textInFinnish + " / " + textInSwedish}>{textInFinnish}</div>
            <div className="score-row">
              <span className="single-score"><img src="/img/star_off.png"/></span>
              <span className="single-score"><img src="/img/star_off.png"/></span>
              <span className="single-score"><img src="/img/star_off.png"/></span>
              <span className="single-score"><img src="/img/star_off.png"/></span>
            </div>
           </div>
  }
}
