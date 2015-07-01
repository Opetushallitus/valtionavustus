import _ from 'lodash'
import traverse from 'traverse'
import JsUtil from './JsUtil.js'

export default class FormBranchGrower {
  /**
   * Assumes that the current direct children of parentNode have ids ending with numbers.
   * That number will be incremented for the direct children, and if those have more children,
   * their ids will be replicated with their path from the growing parent as prefix. Like this:
   *
   * other-organisations
   * |
   * +-- other-organisations-1  // existing node
   * |   |
   * |   +-- other-organisations.other-organisations-1.name
   * |   |
   * |   +-- other-organisations.other-organisations-1.email
   * |
   * +-- other-organisations-2  // new node
   *     |
   *     +-- other-organisations.other-organisations-2.name
   *     |
   *     +-- other-organisations.other-organisations-2.email
   *
   * @param parentNode  Node whose children are repeated For safety, let's ensure the ids we generate are unique in the whole form
   */
  static createNewChild(parentNode, enable) {
    const parentId = parentNode.id
    const currentLastChild = _.last(parentNode.children)
    const newChild = _.cloneDeep(currentLastChild)
    populateNewIdsTo(newChild, parentId, parentNode)
    _.forEach(JsUtil.flatFilter(newChild, n => { return !_.isUndefined(n.id) }),
      field => {
        field.skipValidationOnMount = true
        field.forceDisabled = !enable
      }
    )
    return newChild

    function populateNewIdsTo(node) {
      const oldId = node.id
      var oldIndex = parseIndexFrom(oldId)
      node.id = oldId.replace(oldIndex, oldIndex + 1)
      _.forEach(node.children, n => {
        n.id = n.id.replace(oldId, node.id)
      })
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