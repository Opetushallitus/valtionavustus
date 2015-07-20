import _ from 'lodash'
import traverse from 'traverse'

export default class JsUtil {
  static flatFilter(objectOrArray, nodePredicate) {
    return JsUtil.traverseMatching(objectOrArray, nodePredicate, _.identity)
  }

  static traverseMatching(objectOrArray, nodePredicate, operation) {
    return traverse(objectOrArray).reduce(function (acc, x) {
      if (nodePredicate(x)) {
        const nodeResult = operation(x)
        acc.push(nodeResult)
      }
      return acc
    }, [])
  }

  static findJsonNodeContainingId(objectOrArray, idToFind) {
    const allNodesContainingNode = _.filter(objectOrArray, function (parentNode) {
      return !_.isEmpty(JsUtil.flatFilter(parentNode, childNode => { return childNode.id === idToFind }))
    })
    if (allNodesContainingNode.length > 1) {
      throw new Error("Cannot handle case with " + allNodesContainingNode.length +
        " growing parents yet, expected a single one. fieldId=" + idToFind)
    }
    return _.first(allNodesContainingNode)
  }
}