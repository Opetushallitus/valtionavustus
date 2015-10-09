import React, { Component } from 'react'
import _ from 'lodash'

export default class HakemusScoring extends Component {
  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const allScoresOfHakemus = hakemus.scores
    const userInfo = this.props.userInfo

    function findScores(perusteIndex) {
      return _.filter(allScoresOfHakemus, s => { return s["selection-criteria-index"] === perusteIndex })
    }

    const avustushaku = this.props.avustushaku
    const valintaperusteet = _.get(avustushaku, "content.selection-criteria.items")
    var perusteIndex = 0
    const valintaPerusteRows = _.map(valintaperusteet,
                                     peruste => { return <ValintaPerusteRow valintaperuste={peruste}
                                                                            scores={findScores(perusteIndex)}
                                                                            userInfo={userInfo}
                                                                            key={perusteIndex++} /> })
    return <div key="hakemus-scoring-container" id="hakemus-scoring-container">
             <div className="valintaperuste-list">
               {valintaPerusteRows}
             </div>
           </div>
  }
}

class ValintaPerusteRow extends Component {
  render() {
    const valintaperuste = this.props.valintaperuste
    const allScoresOfThisPeruste = this.props.scores
    const userInfo = this.props.userInfo
    const myScore = _.find(allScoresOfThisPeruste, s => { return s["person-oid"] === userInfo["person-oid"] })
    const starElements = _.map(_.range(4), i => <StarElement key={i} index={i} myScore={myScore} />)

    const textInFinnish = valintaperuste.fi
    const textInSwedish = valintaperuste.sv

    return <div className="single-valintaperuste">
            <div className="valintaperuste-text" title={textInFinnish + " / " + textInSwedish}>{textInFinnish}</div>
            <div className="score-row">
              {starElements}
            </div>
           </div>
  }
}

class StarElement extends Component {
  render() {
    const index = this.props.index
    const myScore = this.props.myScore
    const starImage = myScore && myScore.score >= index ? "/img/star_on.png" : "/img/star_off.png"
    return <span className="single-score"><img src={starImage}/></span>
  }
}