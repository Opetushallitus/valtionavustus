import React from "react";
import {createAverageSummaryText, effectiveAverage} from "../ScoreResolver";
import {UserInfo} from "../types";
import {Scoring} from "soresu-form/web/va/types";

interface Props {
  userInfo: UserInfo
  allowHakemusScoring: boolean
  scoring: Scoring
}

const starOffImage = "/virkailija/img/star_off.png"
export default function StarScoring(props: Props) {
  const {userInfo, allowHakemusScoring, scoring} = props
  const meanScore = effectiveAverage(scoring, userInfo, allowHakemusScoring)
  const normalizedMeanScore = meanScore! + 1
  const starElements = [0, 1, 2, 3].map(indexOfStar => {
    const isVisible = Math.ceil(meanScore!) >= indexOfStar
    const starImage = isVisible ? "/virkailija/img/star_on.png" : starOffImage

    let className = "single-score"

    const needsScaling = normalizedMeanScore > indexOfStar && normalizedMeanScore < indexOfStar + 1
    if (needsScaling) {
      const delta = normalizedMeanScore - indexOfStar
      if (delta <= 0.25) {
        className = "single-score-0"
      } else if (delta <= 0.5) {
        className = "single-score-25"
      } else if (delta <= 0.75) {
        className = "single-score-50"
      } else {
        className = "single-score-75"
      }
    }
    return <img key={indexOfStar} className={className} src={starImage}/>
  })

  const titleText = meanScore === undefined ?
    (allowHakemusScoring ? "Pisteytä hakemus jokaisen valintaperusteen mukaan nähdäksesi kaikkien arvioiden keskiarvon" : null) :
    createAverageSummaryText(scoring, userInfo)

  return (
    <div className="list-score-row" title={titleText!}>
      {starElements}
    </div>
  )
}

export function EmptyScore() {
  const emptyStarElements = [0, 1, 2, 3].map(indexOfStar => {
    return <img key={indexOfStar} className={"single-score"}
                src={starOffImage}/>
  })

  return (
    <div className={"list-score-row"}>
      {emptyStarElements}
    </div>
  )
}
