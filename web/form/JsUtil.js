import _ from 'lodash'
import traverse from 'traverse'

export default class JsUtil {
  static filterJson(objectOrArray, nodePredicate) {
    return traverse(objectOrArray).reduce(function (acc, x) {
      if (nodePredicate(this)) {
        acc.push(x)
      }
      return acc
    }, [])
  }

  static findJsonNodeContainingId(objectOrArray, idToFind) {
    const allNodesContainingNode = _.filter(objectOrArray, function (fieldSetNode) {
      return !_.isEmpty(JsUtil.filterJson(fieldSetNode, function (childNode) {
        return childNode.key === "id" && childNode.node === idToFind
      }))
    })
    if (allNodesContainingNode.length > 1) {
      throw new Error("Cannot handle case with " + allNodesContainingNode.length +
        " growing parents yet, expected a single one. fieldId=" + idToFind)
    }
    return _.first(allNodesContainingNode)
  }
}