import _ from 'lodash'
import traverse from 'traverse'
import JsUtil from './JsUtil.js'

export default class FormBranchGrower {
  static expandGrowingFieldSetIfNeeded(state, fieldUpdate) {
    if (growingFieldSetExpandMustBeTriggered(state, fieldUpdate)) {
      expandGrowingFieldset(state, fieldUpdate)
    }

    function growingFieldSetExpandMustBeTriggered(state, fieldUpdate) {
      const growingSetOfThisField = fieldUpdate.growingParent
      if (!growingSetOfThisField) {
        return false
      }

      const allFieldIdsInSameGrowingSet = JsUtil.
        flatFilter(growingSetOfThisField, n => { return !_.isUndefined(n.id) }).
        map(n => { return n.id })
      const wholeSetIsValid = _.reduce(allFieldIdsInSameGrowingSet, (acc, fieldId) => {
        return acc && (state.clientSideValidation[fieldId] !== false)
      }, true)

      // TODO: Assess if the "last" check is needed. Possibly it's enough that the whole thing is valid, minus last row that needs to be skipped in validation, when there are filled rows.
      const lastChildOfGrowingSet = _.last(_.filter(growingSetOfThisField.children, f => { return !f.forceDisabled }))
      const thisFieldIsInLastChildToBeRepeated = _.some(lastChildOfGrowingSet.children, x => { return x.id === fieldUpdate.id })

      return wholeSetIsValid && thisFieldIsInLastChildToBeRepeated
    }

    function expandGrowingFieldset(state, fieldUpdate) {
      const growingFieldSet = fieldUpdate.growingParent
      _.forEach(JsUtil.flatFilter(growingFieldSet.children, n => { return !_.isUndefined(n.id) }), n => {
        n.forceDisabled = false
      })
      const allExistingFieldIds = JsUtil.flatFilter(state.form.content, n => { return !_.isUndefined(n.id) }).
        map(n => { return n.id })
      const newSet = FormBranchGrower.createNewChild(growingFieldSet)
      growingFieldSet.children.push(newSet)
    }
  }

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
   * @param parentNode  Node whose children are repeated
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