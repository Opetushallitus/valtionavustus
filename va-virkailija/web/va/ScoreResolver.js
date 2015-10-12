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

  static effectiveAverage(scoring, userInfo) {
    return scoring && _.some(scoring["score-averages-by-user"], isMyScore) ? scoring["score-total-average"] : undefined
    function isMyScore(scoreAverageByUser) {
      return ScoreResolver._belongsToUser(scoreAverageByUser, userInfo)
    }
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