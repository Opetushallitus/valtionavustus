import React from 'react'
import { createAverageSummaryText, effectiveAverage } from '../../ScoreResolver'
import { Scoring } from 'soresu-form/web/va/types'

import * as styles from './StarScoring.module.css'
import { useUserInfo } from '../../initial-data-context'

interface StarProps {
  style: 'empty' | 'blue'
  opacity: number
}

const Star: React.FC<StarProps> = ({ style, opacity }) => {
  const emptyStyle = style === 'empty'
  const fill = emptyStyle ? 'none' : '#499CC7'
  const stroke = emptyStyle ? '#1A1919' : '#499CC7'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        d="M7.08203 1.24219L5.30469 4.87891L1.28516 5.45312C0.574219 5.5625 0.300781 6.4375 0.820312 6.95703L3.69141 9.77344L3.00781 13.7383C2.89844 14.4492 3.66406 14.9961 4.29297 14.668L7.875 12.7812L11.4297 14.668C12.0586 14.9961 12.8242 14.4492 12.7148 13.7383L12.0312 9.77344L14.9023 6.95703C15.4219 6.4375 15.1484 5.5625 14.4375 5.45312L10.4453 4.87891L8.64062 1.24219C8.33984 0.613281 7.41016 0.585938 7.08203 1.24219Z"
        opacity={!emptyStyle ? `${opacity}%` : undefined}
      />
    </svg>
  )
}

interface StarScoringProps {
  id: number
  allowHakemusScoring: boolean
  scoring?: Scoring
}

const toStarElem = (meanScore: number) => (indexOfStar: number) => {
  const opacity = Math.ceil((meanScore + 1 - indexOfStar) * 100)
  return (
    <Star
      key={`star-scoring-${indexOfStar}`}
      style={opacity > 0 ? 'blue' : 'empty'}
      opacity={opacity}
    />
  )
}

export const StarScoring = (props: StarScoringProps) => {
  const { allowHakemusScoring, scoring } = props
  const userInfo = useUserInfo()
  const meanScore = scoring && effectiveAverage(scoring, userInfo, allowHakemusScoring)
  if (!scoring || meanScore === undefined) {
    return <EmptyScore />
  }

  const starElements = [0, 1, 2, 3].map(toStarElem(meanScore))
  const titleText =
    meanScore === undefined
      ? allowHakemusScoring
        ? 'Pisteytä hakemus jokaisen valintaperusteen mukaan nähdäksesi kaikkien arvioiden keskiarvon'
        : undefined
      : createAverageSummaryText(scoring, userInfo)

  return (
    <div
      data-test-id={`hakemus-scoring-${props.id}`}
      className={styles.starContainer}
      title={titleText}
    >
      {starElements}
    </div>
  )
}

function EmptyScore() {
  const emptyStarElements = [0, 1, 2, 3].map((indexOfStar) => (
    <Star key={`empty-score-star-${indexOfStar}`} style="empty" opacity={100} />
  ))

  return <div className={styles.starContainer}>{emptyStarElements}</div>
}
