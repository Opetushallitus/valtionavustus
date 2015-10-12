import React, { Component } from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import ScoreResolver from '../ScoreResolver.js'

export default class HakemusScoring extends Component {
  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const allScoresOfHakemus = hakemus.scores
    const scoringOfHakemus = hakemus.arvio ? hakemus.arvio.scoring : undefined
    const myUserInfo = this.props.userInfo
    const showOthersScores = this.props.showOthersScores && ScoreResolver.myScoringIsComplete(scoringOfHakemus, myUserInfo)

    const avustushaku = this.props.avustushaku
    const valintaperusteet = _.get(avustushaku, "content.selection-criteria.items")
    const myOwnValintaPerusteRows = HakemusScoring.createValintaPerusteRows(allScoresOfHakemus,
      valintaperusteet, myUserInfo["person-oid"], controller)
    const othersScoreDisplays = showOthersScores ?
      HakemusScoring.createOthersScoreDisplays(allScoresOfHakemus, scoringOfHakemus, valintaperusteet, myUserInfo) : undefined
    return <div key="hakemus-scoring-container" id="hakemus-scoring-container">
             <div className="valintaperuste-list">
               {myOwnValintaPerusteRows}
             </div>
             <SeeOthersScores showOthersScores={showOthersScores}
                              scoring={scoringOfHakemus}
                              userInfo={myUserInfo}
                              controller={controller} />
             {othersScoreDisplays}
           </div>
  }

  static createValintaPerusteRows(allScoresOfHakemus, valintaperusteet, personOid, controller) {
    var perusteIndex = 0
    return _.map(valintaperusteet, peruste => { return <ValintaPerusteRow valintaperuste={peruste}
                                                                          scores={findScores(perusteIndex)}
                                                                          selectionCriteriaIndex={perusteIndex}
                                                                          personOid={personOid}
                                                                          key={personOid + perusteIndex++}
                                                                          controller={controller} /> })

    function findScores(perusteIndex) {
      return _.filter(allScoresOfHakemus, s => { return s["selection-criteria-index"] === perusteIndex })
    }
  }

  static createOthersScoreDisplays(allScoresOfHakemus, scoringOfHakemus, valintaperusteet, myUserInfo) {
    const othersPersonOids = _.map(ScoreResolver.othersScorings(scoringOfHakemus, myUserInfo), s => { return s["person-oid"]})
    return _.map(othersPersonOids, oid => {
      return  HakemusScoring.createValintaPerusteRows(allScoresOfHakemus, valintaperusteet, oid)
    })
  }
}

class ValintaPerusteRow extends Component {
  render() {
    const valintaperuste = this.props.valintaperuste
    const selectionCriteriaIndex = this.props.selectionCriteriaIndex
    const allScoresOfThisPeruste = this.props.scores
    const personOid = this.props.personOid
    const controller = this.props.controller
    const scoreOfUser = _.find(allScoresOfThisPeruste, s => { return s["person-oid"] === personOid })
    const scoreOfUserFi = ScoreResolver.scoreToFI(scoreOfUser ? scoreOfUser.score : null)
    const starElements = _.map(_.range(4), i => <StarElement key={i}
                                                             index={i}
                                                             scoreOfUser={scoreOfUser}
                                                             selectionCriteriaIndex={selectionCriteriaIndex}
                                                             controller={controller} />)

    const textInFinnish = valintaperuste.fi
    const textInSwedish = valintaperuste.sv

    return (
      <div className="single-valintaperuste">
        <div className="valintaperuste-text" title={textInFinnish + " / " + textInSwedish}>{textInFinnish}</div>
        <div className="score-row">
          {starElements}
          <div className="score-text">{scoreOfUserFi}</div>
        </div>
      </div>
    )
  }
}

class StarElement extends Component {
  render() {
    const indexOfStar = this.props.index
    const starTitle = ScoreResolver.scoreToFI(indexOfStar)
    const scoreOfUser = this.props.scoreOfUser
    const selectionCriteriaIndex = this.props.selectionCriteriaIndex
    const starImage = scoreOfUser && scoreOfUser.score >= indexOfStar ? "/img/star_on.png" : "/img/star_off.png"

    const controller = this.props.controller
    const enableEditing = !_.isUndefined(controller)
    const classNames = ClassNames("single-score", {editable: enableEditing})
    const onClick = enableEditing ? event => { controller.setScore(selectionCriteriaIndex, indexOfStar) } : undefined
    const showHover = enableEditing ? event => { event.target.setAttribute("src", "/img/star_hover.png") } : undefined
    const hideHover = enableEditing ? event => { event.target.setAttribute("src", starImage)} : undefined
    return <img className={classNames}
                src={starImage}
                title={starTitle}
                onClick={onClick}
                onMouseOver={showHover}
                onMouseOut={hideHover}/>
  }
}

class SeeOthersScores extends Component {
  render() {
    const controller = this.props.controller
    const scoring = this.props.scoring
    const userInfo = this.props.userInfo
    const showOthersScores = this.props.showOthersScores
    const myScoringIsComplete = ScoreResolver.myScoringIsComplete(scoring, userInfo)
    const othersScoringsCount = myScoringIsComplete ? ScoreResolver.othersScorings(scoring, userInfo).length : 0
    const classNames = ClassNames("see-others-scoring", {disabled: !myScoringIsComplete || othersScoringsCount === 0})

    const labelText = resolveLabelText()
    const titleText = myScoringIsComplete ? ScoreResolver.createAverageSummaryText(scoring, userInfo) : undefined

    const onClick = e => {
      e.preventDefault()
      if (othersScoringsCount > 0) {
        controller.toggleOthersScoresDisplay()
      }
    }

    return <div className={classNames}>
      <a href="#" title={titleText} onClick={onClick}>{labelText}</a>
    </div>

    function resolveLabelText() {
      if (!myScoringIsComplete) {
        return "Pisteytä hakemus kokonaan nähdäksesi muiden arviot"
      }
      if (othersScoringsCount === 0) {
        return "Ei arvioita muilta"
      }
      return showOthersScores ? "Piilota muiden arviot" : "Katso muiden arviot (" + othersScoringsCount + ")"
    }
  }
}