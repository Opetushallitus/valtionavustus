export default class ScoreResolver {
  static scoreToFI(score) {
    switch(score) {
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


  static createAverageSummaryText(scoring, userInfo) {
    const numberOfScorings = scoring["score-averages-by-user"].length
    const meanScore = ScoreResolver.effectiveAverage(scoring, userInfo)
    const scoringSubstantive = numberOfScorings > 1 ? " arviota" : " arvio"
    return numberOfScorings + scoringSubstantive + ". Keskiarvo: " + meanToDisplay(meanScore) + "\n" + createSummaryText();

    function createSummaryText() {
      const othersScorings = ScoreResolver.othersScorings(scoring, userInfo)
      const textFromOthersResults = _.map(othersScorings, s => {
        return " - " + s["first-name"] + " " + s["last-name"] + ": " + meanToDisplay(s["score-average"]) + "\n"
      })

      const myAverage = ScoreResolver.myAverage(scoring, userInfo)
      return textFromOthersResults + " - oma arviosi: " + meanToDisplay(myAverage)
    }

    function meanToDisplay(meanScore) {
      return (1 + Math.round(10 * meanScore) / 10.0) + " (" + ScoreResolver.scoreToFI(Math.round(meanScore)) + ")"
    }
  }

  static myScoringIsComplete(scoring, userInfo) {
    return scoring && _.some(scoring["score-averages-by-user"], isMyScore)
    function isMyScore(scoreAverageByUser) {
      return ScoreResolver._belongsToUser(scoreAverageByUser, userInfo)
    }
  }

  static effectiveAverage(scoring, userInfo) {
    return ScoreResolver.myScoringIsComplete(scoring, userInfo) ? scoring["score-total-average"] : undefined
  }

  static scoringByOid(scoring, personOid) {
    return _.find(scoring["score-averages-by-user"], a => {
      return a && a["person-oid"] === personOid
    })
  }

  static myAverage(scoring, userInfo) {
    const myScore = _.find(scoring["score-averages-by-user"], a => ScoreResolver._belongsToUser(a, userInfo))
    return myScore["score-average"]
  }

  static othersScorings(scoring, userInfo) {
    return _.filter(scoring["score-averages-by-user"], a => !ScoreResolver._belongsToUser(a, userInfo))
  }

  static _belongsToUser(scoreAverageByUser, userInfo) {
    return scoreAverageByUser && scoreAverageByUser["person-oid"] === userInfo["person-oid"]
  }
}