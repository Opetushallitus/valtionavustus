import {Scoring, PersonScoreAverage} from 'soresu-form/web/va/types'
import {UserInfo} from "./types";

export function scoreToFI(score: number): string {
  switch (score) {
    case 0:
      return "Ei toteudu"
    case 1:
      return "Toteutuu"
    case 2:
      return "Toteutuu hyvin"
    case 3:
      return "Toteutuu erinomaisesti"
  }
  return "Ei arviota"
}

export function createAverageSummaryText(scoring: Scoring, userInfo: UserInfo): string {
  if (!scoring || !scoring["score-averages-by-user"] || scoring["score-averages-by-user"].length === 0) {
    return "Ei arvioita"
  }
  const averagesByUser = scoring["score-averages-by-user"]
  const numberOfScorings = averagesByUser.length
  const meanScore = effectiveAverage(scoring, userInfo)
  const scoringSubstantive = numberOfScorings > 1 ? " arviota" : " arvio"
  return numberOfScorings + scoringSubstantive + ". Keskiarvo: " + meanToDisplay(meanScore!) + "\n" + createSummaryText()

  function createSummaryText() {
    const othersScorings = ScoreResolver.othersScorings(scoring, userInfo)
    const textFromOthersResults = othersScorings.map(s => {
      return " - " + s["first-name"] + " " + s["last-name"] + ": " + meanToDisplay(s["score-average"]) + "\n"
    })

    const myAverage = ScoreResolver.myAverage(scoring, userInfo)
    return textFromOthersResults + (myAverage ? " - oma arviosi: " + meanToDisplay(myAverage) : "")
  }

  function meanToDisplay(meanScore: number) {
    return (1 + Math.round(10 * meanScore) / 10.0) + " (" + scoreToFI(Math.round(meanScore)) + ")"
  }
}

export function myScoringIsComplete(scoring: Scoring, userInfo: UserInfo) {
  return scoring && scoring["score-averages-by-user"].some(isMyScore)

  function isMyScore(scoreAverageByUser: PersonScoreAverage) {
    return ScoreResolver._belongsToUser(scoreAverageByUser, userInfo)
  }
}

export function effectiveAverage(scoring: Scoring, userInfo: UserInfo, allowHakemusScoring: boolean = false): number | undefined {
  if (!scoring || !scoring["score-averages-by-user"] || scoring["score-averages-by-user"].length === 0) {
    return undefined
  }
  return !allowHakemusScoring || myScoringIsComplete(scoring, userInfo) ? scoring["score-total-average"] : undefined
}

export default class ScoreResolver {
  static scoringByOid(scoring: Scoring, personOid: string): PersonScoreAverage | undefined {
    return scoring["score-averages-by-user"].find((personScoreAverage: PersonScoreAverage) => {
      return personScoreAverage && personScoreAverage["person-oid"] === personOid
    })
  }

  static myAverage(scoring: Scoring, userInfo: UserInfo): number | undefined {
    const myScore = scoring["score-averages-by-user"]
      .find((personScoreAverage: PersonScoreAverage) => ScoreResolver._belongsToUser(personScoreAverage, userInfo))
    return myScore ? myScore["score-average"] : undefined
  }

  static othersScorings(scoring: Scoring, userInfo: UserInfo): PersonScoreAverage[] {
    return scoring["score-averages-by-user"].filter(a => !ScoreResolver._belongsToUser(a, userInfo))
  }

  static _belongsToUser(scoreAverageByUser: PersonScoreAverage, userInfo: UserInfo): boolean {
    return scoreAverageByUser && scoreAverageByUser["person-oid"] === userInfo["person-oid"]
  }
}
