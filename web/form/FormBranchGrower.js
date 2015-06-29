import _ from 'lodash'
import traverse from 'traverse'
import JsUtil from './JsUtil.js'

export default class FormBranchGrower {
  /**
   * Assumes that the current direct children of parentNode have ids ending with numbers.
   * That number will be incremented for the direct children, and if those have more children,
   * their ids will be replicated with their direct parents id as prefix. Like this:
   *
   * other-organisations
   * |
   * +-- other-organisations-1  // existing node
   * |   |
   * |   +-- other-organisations-1-name
   * |   |
   * |   +-- other-organisations-1-email
   * |
   * +-- other-organisations-2  // new node
   *     |
   *     +-- other-organisations-2-name
   *     |
   *     +-- other-organisations-2-email
   *
   * @param parentNode  Node whose children are repeated
   * @param reservedIds For safety, let's ensure the ids we generate are unique in the whole form
   */
  static createNewChild(parentNode, reservedIds) {
    const parentId = parentNode.id
    const currentLastChild = _.last(parentNode.children)
    const newChild = _.cloneDeep(currentLastChild)
    populateNewIdsTo(newChild, parentId, parentId)
    _.forEach(JsUtil.flatFilter(newChild, n => { return !_.isUndefined(n.id) }),
      field => { field.skipValidationOnMount = true }
    )
    return newChild

    function populateNewIdsTo(node, parentId, oldNonDistinguishingPrefix) {
      const oldId = node.id
      const distinguishingPartOfOldId = oldId.replace(oldNonDistinguishingPrefix, "")
      var oldIndex = parseIndexFrom(distinguishingPartOfOldId)
      node.id = joinAndIncrementIfNeeded(parentId, distinguishingPartOfOldId, oldIndex)
      _.forEach(node.children, n => { populateNewIdsTo(n, node.id, oldId) })
    }

    function joinAndIncrementIfNeeded(parentId, oldDistinguisher, oldIndex) {
      const newIndex = oldIndex === "" ? "" : oldIndex + 1
      const newDistinguisher = oldDistinguisher.replace(new RegExp(oldIndex + '$'), newIndex)
      const proposedId = parentId + (_.startsWith(newDistinguisher, "-") ? "" : "-") + newDistinguisher
      if (!_.contains(reservedIds, proposedId)) {
        return proposedId
      }
      return joinAndIncrementIfNeeded(parentId, oldDistinguisher, newIndex + 1)
    }

    function parseIndexFrom(id) {
      if (!id || id.length < 0) {
        throw new Error("Cannot parse index from empty id")
      }
      const index = _.last(id.split("-"))
      if (!index || index.length == 0 || isNaN(index) || !(_.isFinite(parseInt(index)))) {
        return ""
      }
      return parseInt(index)
    }
  }
}