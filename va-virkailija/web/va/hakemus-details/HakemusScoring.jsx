import React, { Component } from 'react'
import _ from 'lodash'

import ScoreResolver from '../ScoreResolver.js'

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
                                                                            selectionCriteriaIndex={perusteIndex}
                                                                            userInfo={userInfo}
                                                                            key={perusteIndex++}
                                                                            controller={controller} /> })
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
    const selectionCriteriaIndex = this.props.selectionCriteriaIndex
    const allScoresOfThisPeruste = this.props.scores
    const userInfo = this.props.userInfo
    const controller = this.props.controller
    const myScore = _.find(allScoresOfThisPeruste, s => { return s["person-oid"] === userInfo["person-oid"] })
    const myScoreFI = ScoreResolver.scoreToFI(myScore ? myScore.score : null)
    const starElements = _.map(_.range(4), i => <StarElement key={i}
                                                             index={i}
                                                             myScore={myScore}
                                                             selectionCriteriaIndex={selectionCriteriaIndex}
                                                             controller={controller} />)

    const textInFinnish = valintaperuste.fi
    const textInSwedish = valintaperuste.sv

    return (
      <div className="single-valintaperuste">
        <div className="valintaperuste-text" title={textInFinnish + " / " + textInSwedish}>{textInFinnish}</div>
        <div className="score-row">
          {starElements}
          <div className="score-text">{myScoreFI}</div>
        </div>
      </div>
    )
  }
}

class StarElement extends Component {
  render() {
    const indexOfStar = this.props.index
    const starTitle = ScoreResolver.scoreToFI(indexOfStar)
    const myScore = this.props.myScore
    const selectionCriteriaIndex = this.props.selectionCriteriaIndex
    const controller = this.props.controller
    const onClick = event => { controller.setScore(selectionCriteriaIndex, indexOfStar) }
    const starImage = myScore && myScore.score >= indexOfStar ? "/img/star_on.png" : "/img/star_off.png"
    const showHover = event => { event.target.setAttribute("src", "/img/star_hover.png") }
    const hideHover = event => { event.target.setAttribute("src", starImage)}
    return <img className="single-score"
                src={starImage}
                title={starTitle}
                onClick={onClick}
                onMouseOver={showHover}
                onMouseOut={hideHover}/>
  }
}
