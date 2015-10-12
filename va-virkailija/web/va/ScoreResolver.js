export default class ScoreResolver {
  static effectiveAverage(scoring, userInfo) {
    return scoring && _.some(scoring["score-averages-by-user"], isMyScore) ? scoring["score-total-average"] : undefined
    function isMyScore(scoreAverageByUser) {
      return scoreAverageByUser && scoreAverageByUser["person-oid"] === userInfo["person-oid"]
    }
  }
}