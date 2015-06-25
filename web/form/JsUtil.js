import _ from 'lodash'
import traverse from 'traverse'

export default class JsUtil {
  static flatFilter(objectOrArray, nodePredicate) {
    return traverse(objectOrArray).reduce(function (acc, x) {
      if (nodePredicate(x)) {
        acc.push(x)
      }
      return acc
    }, [])
  }

  static findJsonNodeContainingId(objectOrArray, idToFind) {
    const allNodesContainingNode = _.filter(objectOrArray, function (fieldSetNode) {
      return !_.isEmpty(JsUtil.flatFilter(fieldSetNode, function (childNode) {
        return childNode.id === idToFind
      }))
    })
    if (allNodesContainingNode.length > 1) {
      throw new Error("Cannot handle case with " + allNodesContainingNode.length +
        " growing parents yet, expected a single one. fieldId=" + idToFind)
    }
    return _.first(allNodesContainingNode)
  }
}